/*
 * This file is part of the INTO-CPS toolchain.
 *
 * Copyright (c) 2017-CurrentYear, INTO-CPS Association,
 * c/o Professor Peter Gorm Larsen, Department of Engineering
 * Finlandsgade 22, 8200 Aarhus N.
 *
 * All rights reserved.
 *
 * THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
 * THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
 * ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
 * RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL 
 * VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
 *
 * The INTO-CPS toolchain  and the INTO-CPS Association Public License 
 * are obtained from the INTO-CPS Association, either from the above address,
 * from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
 * GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of  MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
 * BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
 * THE INTO-CPS ASSOCIATION.
 *
 * See the full INTO-CPS Association Public License conditions for more details.
 *
 * See the CONTRIBUTORS file for author and contributor information. 
 */

import { Parser, Serializer } from "./Parser";
import { WarningMessage, ErrorMessage } from "./Messages";
import {
    Fmu, Instance, ScalarVariableType, isTypeCompatipleWithValue,
    isTypeCompatiple, InstanceScalarPair, ScalarVariable
} from "../angular2-app/coe/models/Fmu";
import * as Path from 'path';
import * as fs from 'fs';

// Multi-Model

export class MultiModelConfig implements ISerializable {

    //path to the source from which this DOM is generated
    sourcePath: string;
    fmusRootPath: string;
    fmus: Fmu[] = [];
    fmuInstances: Instance[] = [];
    instanceScalarPairs: InstanceScalarPair[] = [];

    public getInstance(fmuName: string, instanceName: string) {
        return this.fmuInstances.find(v => v.fmu.name == fmuName && v.name == instanceName) || null;
    }

    public getInstanceOrCreate(fmuName: string, instanceName: string) {
        let instance = this.getInstance(fmuName, instanceName);

        if (!instance) {
            //multimodel does not contain this instance
            let fmu = this.getFmu(fmuName);

            if (fmu) {
                instance = new Instance(fmu, instanceName);
                this.fmuInstances.push(instance);
            }
        }

        return instance;
    }

    public getFmu(fmuName: string): Fmu {
        return this.fmus.find(v => v.name == fmuName) || null;
    }

    getInstanceScalarPair(fmuName: string, instanceName: string, scalarName: string): InstanceScalarPair {
        let pair = this.instanceScalarPairs.find(pair => {
            return pair.instance.fmu.name === fmuName && pair.instance.name === instanceName && pair.scalarVariable.name === scalarName;
        });

        if (pair)
            return pair;

        let instance = this.getInstance(fmuName, instanceName);

        if (!instance)
            return null;

        let scalar = instance.fmu.getScalarVariable(scalarName);

        pair = new InstanceScalarPair(instance, scalar);
        this.instanceScalarPairs.push(pair);

        return pair;
    }

    static create(path: string, fmuRootPath: string, data: any): Promise<MultiModelConfig> {
        let parser = new Parser();

        let mm = new MultiModelConfig();
        mm.sourcePath = path;
        mm.fmusRootPath = fmuRootPath;

        return parser
            .parseFmus(data, Path.normalize(fmuRootPath))
            .then(fmus => {
                mm.fmus = fmus;

                parser.parseConnections(data, mm);
                parser.parseParameters(data, mm);

                return mm;
            });
    }

    static parse(path: string, fmuRootPath: string): Promise<MultiModelConfig> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(path, (error, data) => {
                if (error)
                    reject(error);
                else
                    resolve(data);
            });
        }).then(content => this.create(path, fmuRootPath, JSON.parse(content.toString())));
    }

    public addFmu() {
        let fmu = new Fmu();
        this.fmus.push(fmu);

        return fmu;
    }

    public removeFmu(fmu: Fmu) {
        this.fmus.splice(this.fmus.indexOf(fmu), 1);

        this.fmuInstances
            .filter(element => element.fmu == fmu)
            .forEach(element => this.removeInstance(element));
    }

    public addInstance(fmu: Fmu, name?: string) {
        let instance = new Instance(fmu, name || `${fmu.name.replace(/[{}]/g, "")}Instance`);
        this.fmuInstances.push(instance);

        return instance;
    }

    public removeInstance(instance: Instance) {
        // Remove the instance
        this.fmuInstances.splice(this.fmuInstances.indexOf(instance), 1);

        // When removing an instance, all connections to this instance must be removed as well.  
        this.fmuInstances.forEach(element => {
            element.outputsTo.forEach(value => {
                for (let i = value.length - 1; i >= 0; i--) {
                    if (value[i].instance == instance) {
                        value.splice(i, 1);
                    }
                }
            });
        });
    }

    toObject(): any {
        let fmus: any = {};
        let connections: any = {};
        let parameters: any = {};

        this.fmus.forEach((fmu: Fmu) => {
            let path = fmu.path;
            if (path.indexOf(this.fmusRootPath) >= 0)
                path = path.substring(this.fmusRootPath.length + 1);

            fmus[fmu.name] = path;
        });

        this.fmuInstances.forEach((instance: Instance) => {
            instance.outputsTo.forEach((pairs: InstanceScalarPair[], sv: ScalarVariable) => {
                connections[Serializer.getIdSv(instance, sv)] = pairs.map(pair => Serializer.getIdSv(pair.instance, pair.scalarVariable));
            });

            instance.initialValues.forEach((value: any, sv: ScalarVariable) => {
                let id: string = Serializer.getIdSv(instance, sv);

                if (sv.type === ScalarVariableType.Bool)
                    parameters[id] = Boolean(value);
                else if (sv.type === ScalarVariableType.Int || sv.type === ScalarVariableType.Real)
                    parameters[id] = Number(value);
                else
                    parameters[id] = value;
            });
        });

        return {
            fmus: fmus,
            connections: connections,
            parameters: parameters
        };
    }

    validate(): WarningMessage[] {
        let messages: WarningMessage[] = [];

        var usedInputs: Map<String, String> = new Map();

        // perform check
        this.fmuInstances.forEach(instance => {
            //check connections
            instance.outputsTo.forEach((pairs, sv) => {

                let outputKey = Serializer.getIdSv(instance, sv);

                if (sv.isConfirmed) {
                    pairs.forEach(pair => {

                        let inputKey = Serializer.getIdSv(pair.instance, pair.scalarVariable);
                        if (usedInputs.has(inputKey)) {
                            messages.push(new ErrorMessage(`Input '"${inputKey}"' is connected to two outputs: "${outputKey} and ${usedInputs.get(inputKey)}"`));
                        }
                        usedInputs.set(inputKey, outputKey);


                        if (pair.scalarVariable.isConfirmed) {
                            if (!isTypeCompatiple(sv.type, pair.scalarVariable.type)) {
                                messages.push(new ErrorMessage(`Uncompatible types in connection. The output scalar variable "${instance.fmu.name}.${instance.name}.${sv.name}": ${sv.type} is connected to scalar variable "${pair.instance.fmu.name}.${pair.instance.name}.${pair.scalarVariable.name}": ${pair.scalarVariable.type}`));
                            }
                        } else {
                            messages.push(new WarningMessage(`Use of unconfirmed scalar variable "${pair.instance.fmu.name}.${pair.instance.name}.${pair.scalarVariable.name}" as connection input for the connection output: "${instance.fmu.name}.${instance.name}.${sv.name}`));
                        }
                    });
                } else {
                    messages.push(new WarningMessage(`Use of unconfirmed scalar variable"${instance.fmu.name}.${instance.name}.${sv.name}" as connection output`));
                }
            });

            //check parameters
            instance.initialValues.forEach((value, sv) => {
                if (sv.isConfirmed) {

                    if (!isTypeCompatipleWithValue(sv.type, value)) {
                        messages.push(new ErrorMessage(`Uncompatible types for parameter. "${instance.fmu.name}.${instance.name}.${sv.name}" ${ScalarVariableType[sv.type]}  Value: ${value} ${typeof (value)}`));
                    }
                } else {
                    messages.push(new WarningMessage(`Use of unconfirmed "${instance.fmu.name}.${instance.name}.${sv.name}" as parameter`));
                }
            });
        });

        return messages;
    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let messages = this.validate();

            if (messages.length > 0)
                reject(messages);

            fs.writeFile(this.sourcePath, JSON.stringify(this.toObject()), error => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}
