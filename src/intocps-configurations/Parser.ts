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

import { MultiModelConfig } from "./MultiModelConfig";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm, FmuMaxStepSizeConstraint, VariableStepAlgorithm, VariableStepConstraint,
    ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint, LiveGraph
} from "./CoSimulationConfig";
import * as Path from 'path';
import * as fs from 'fs';
import { Fmu, InstanceScalarPair, Instance, ScalarVariable, CausalityType } from "../angular2-app/coe/models/Fmu";

export class Parser {

    protected FMUS_TAG: string = "fmus";
    protected CONNECTIONS_TAG: string = "connections";
    protected PARAMETERS_TAG: string = "parameters";
    protected LIVESTREAM_TAG: string = "livestream";
    public static GRAPHS_TAG: string = "graphs";
    protected START_TIME_TAG: string = "startTime";
    protected END_TIME_TAG: string = "endTime";
    protected ALGORITHM_TAG: string = "algorithm";
    protected MULTIMODEL_CRC_TAG: string = "multimodel_crc";
    protected LOG_VARIABLES_TAG: string = "logVariables";

    protected ALGORITHM_TYPE: string = "type";
    protected ALGORITHM_TYPE_FIXED: string = "fixed-step";
    protected ALGORITHM_TYPE_VAR: string = "var-step";

    protected ALGORITHM_TYPE_FIXED_SIZE_TAG: string = "size";

    protected ALGORITHM_TYPE_VAR_INIT_SIZE_TAG: string = "initsize";
    protected ALGORITHM_TYPE_VAR_SIZE_TAG: string = "size";
    protected ALGORITHM_TYPE_VAR_CONSTRAINTS_TAG: string = "constraints";

    constructor() { }
    public static fileExists(filePath: string) {
        try {
            return fs.statSync(filePath).isFile() || fs.statSync(filePath).isDirectory();
        }
        catch (err) {
            return false;
        }
    }
    //Parse fmus json tag
    parseFmus(data: any, basePath: string): Promise<Fmu[]> {

        var fmus: Fmu[] = [];

        return new Promise<Fmu[]>((resolve, reject) => {

            var populates: Promise<void>[] = [];
            try {
                if (Object.keys(data).indexOf(this.FMUS_TAG) >= 0) {
                    $.each(Object.keys(data[this.FMUS_TAG]), (j, key) => {
                        var description = "";
                        var path = data[this.FMUS_TAG][key];
                        let fmuExists = false;
                        let fmu: Fmu = (() => {
                            if ((<string>path).length > 0) {
                                // The path can be one of two things:
                                // A full path if the FMU is not located within the project folder.
                                // A name of the file if the FMU is located within the project folder, and then basepath should be appended.
                                let pathToFmu = Parser.fileExists(path) ? path : Path.normalize(basePath + "/" + path);
                                if (Parser.fileExists(pathToFmu)) {
                                    fmuExists = true;
                                    return new Fmu(key, pathToFmu);
                                }
                            }
                            if (!fmuExists) {
                                return new Fmu(key);
                            }
                            // If the FMU has been removed from the directory, then return the FMU without a path

                        })();
                        if (fmuExists) {
                            populates.push(fmu.populate());
                        }
                        fmus.push(fmu);
                    });
                }
            } catch (e) {
                reject(e);
            }

            Promise.all(populates.map(p => p.catch(e => e)))
                .then(results => resolve(fmus))
                .catch(e => reject(e));
        });
    }


    parseId(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name + '.' + scalar-variable
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after instance name";
        }
        let instanceName = rest.substring(0, dotIndex);
        let scalarVariableName = rest.substring(dotIndex + 1);

        return [fmuName, instanceName, scalarVariableName];
    }

    parseIdShort(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name 
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        let instanceName = rest;
        return [fmuName, instanceName];
    }

    //Utility method to obtain an instance from the multimodel by its string id encoding
    private getInstance(multiModel: MultiModelConfig, id: string): Instance {
        let ids = this.parseId(id);

        let fmuName = ids[0];
        let instanceName = ids[1];
        let scalarVariableName = ids[2];

        return multiModel.getInstanceOrCreate(fmuName, instanceName);
    }

    //parse connections
    parseConnections(data: any, multiModel: MultiModelConfig) {

        if (Object.keys(data).indexOf(this.CONNECTIONS_TAG) >= 0) {
            let connectionsEntry = data[this.CONNECTIONS_TAG];
            $.each(Object.keys(connectionsEntry), (j, id) => {

                let ids = this.parseId(id);

                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                var instance = this.getInstance(multiModel, id);

                let inputList = connectionsEntry[id];

                $.each(inputList, (j, inputId) => {
                    let inputIds = this.parseId(inputId);

                    let inFmuName = inputIds[0];
                    let inInstanceName = inputIds[1];
                    let inScalarVariableName = inputIds[2];

                    var inInstance = multiModel.getInstanceOrCreate(inFmuName, inInstanceName);

                    instance.addOutputToInputLink(instance.fmu.getScalarVariable(scalarVariableName),
                        new InstanceScalarPair(inInstance, inInstance.fmu.getScalarVariable(inScalarVariableName)));
                });
            });
        }
    }

    //parse parameters
    parseParameters(data: any, multiModel: MultiModelConfig) {
        var parameters: Map<String, any> = new Map<String, any>();

        if (Object.keys(data).indexOf(this.PARAMETERS_TAG) >= 0) {
            let parameterData = data[this.PARAMETERS_TAG];
            $.each(Object.keys(parameterData), (j, id) => {
                let value = parameterData[id];

                let ids = this.parseId(id);

                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                var instance = this.getInstance(multiModel, id);
                instance.initialValues.set(instance.fmu.getScalarVariable(scalarVariableName), value);
            });
        }

        return parameters;
    }


    parseSimpleTag(data: any, tag: string): any {
        return data[tag] !== undefined ? data[tag] : null;
    }

    parseSimpleTagDefault(data: any, tag: string, defaultValue: any): any {
        return data[tag] !== undefined ? data[tag] : defaultValue;
    }

    parseStartTime(data: any): number {
        return parseFloat(this.parseSimpleTag(data, this.START_TIME_TAG));
    }

    parseEndTime(data: any): number {
        return parseFloat(this.parseSimpleTag(data, this.END_TIME_TAG));
    }

    parseMultiModelCrc(data: any): string {
        return this.parseSimpleTag(data, this.MULTIMODEL_CRC_TAG);
    }

    parseLivestream(data: any, multiModel: MultiModelConfig): Map<Instance, ScalarVariable[]> {
        return this.parseLivestreamInternal(this.LIVESTREAM_TAG, data, multiModel);
    }

    parseLogVariables(data: any, multiModel: MultiModelConfig): Map<Instance, ScalarVariable[]> {
        return this.parseLivestreamInternal(this.LOG_VARIABLES_TAG, data, multiModel);
    }

    parseGraphs(tag: string, data: any, multiModel: MultiModelConfig): LiveGraph[] {
        let graphs: LiveGraph[] = [];

        let graphEntry = data[tag];

        if (graphEntry) {

            for (let g of graphEntry) {
                let graph = new LiveGraph();
                graph.title = this.parseSimpleTag(g, "title");
                graph.setLivestream(this.parseLivestream(g, multiModel));
                graph.externalWindow = this.parseSimpleTagDefault(g, "externalWindow", false);
                graphs.push(graph);
            }
        }

        return graphs;
    }

    parseLivestreamInternal(tag: string, data: any, multiModel: MultiModelConfig): Map<Instance, ScalarVariable[]> {
        let livestream = new Map<Instance, ScalarVariable[]>();
        let livestreamEntry = data[tag];

        if (livestreamEntry) {
            Object.keys(livestreamEntry).forEach(id => {
                let [fmuName, instanceName] = this.parseIdShort(id);
                let instance: Instance = multiModel.getInstance(fmuName, instanceName);

                if (instance)
                    livestream.set(instance, livestreamEntry[id]
                        .filter((name: string) => instance.fmu.scalarVariables.find(variable => variable.name == name && (variable.causality === CausalityType.Output || variable.causality === CausalityType.Local)))
                        .map((name: string) => instance.fmu.getScalarVariable(name)));
            });
        }

        return livestream;
    }

    parseAlgorithm(data: any, multiModel: MultiModelConfig): ICoSimAlgorithm {
        let algorithm = data[this.ALGORITHM_TAG];
        if (!algorithm) return;

        let type = algorithm[this.ALGORITHM_TYPE];

        if (type === this.ALGORITHM_TYPE_VAR)
            return this.parseAlgorithmVar(algorithm, multiModel);

        if (type === this.ALGORITHM_TYPE_FIXED)
            return this.parseAlgorithmFixed(algorithm);
    }

    private parseAlgorithmFixed(data: any): ICoSimAlgorithm {
        return new FixedStepAlgorithm(
            parseFloat(data[this.ALGORITHM_TYPE_FIXED_SIZE_TAG])
        );
    }

    private parseAlgorithmVar(data: any, multiModel: MultiModelConfig): ICoSimAlgorithm {
        let [minSize, maxSize] = this.parseSimpleTag(data, this.ALGORITHM_TYPE_VAR_SIZE_TAG);

        return new VariableStepAlgorithm(
            data[this.ALGORITHM_TYPE_VAR_INIT_SIZE_TAG],
            minSize,
            maxSize,
            this.parseAlgorithmVarConstraints(data[this.ALGORITHM_TYPE_VAR_CONSTRAINTS_TAG], multiModel)
        );
    }

    private parseAlgorithmVarConstraints(constraints: any, multiModel: MultiModelConfig): Array<VariableStepConstraint> {
        return Object.keys(constraints).map(id => {
            let c = constraints[id];

            if (c.type === "zerocrossing") {
                return new ZeroCrossingConstraint(
                    id,
                    c.ports
                        .filter((id: string) => {
                            let [fmuName, instanceName] = this.parseId(id);
                            return !!multiModel.getInstance(fmuName, instanceName);
                        })
                        .map((id: string) => {
                            let [fmuName, instanceName, scalarVariableName] = this.parseId(id);
                            return multiModel.getInstanceScalarPair(fmuName, instanceName, scalarVariableName);
                        }),
                    c.order.toString(),
                    c.abstol,
                    c.safety
                )
            }

            if (c.type === "fmumaxstepsize") {
                return new FmuMaxStepSizeConstraint(
                    id
                )
            }

            if (c.type === "boundeddifference") {
                return new BoundedDifferenceConstraint(
                    id,
                    c.ports
                        .filter((id: string) => {
                            let [fmuName, instanceName] = this.parseId(id);
                            return !!multiModel.getInstance(fmuName, instanceName);
                        })
                        .map((id: string) => {
                            let [fmuName, instanceName, scalarVariableName] = this.parseId(id);
                            return multiModel.getInstanceScalarPair(fmuName, instanceName, scalarVariableName);
                        }),
                    c.abstol,
                    c.reltol,
                    c.safety,
                    c.skipDiscrete
                )
            }

            if (c.type === "samplingrate") {
                return new SamplingRateConstraint(
                    id,
                    c.base,
                    c.rate,
                    c.startTime
                )
            }
        });
    }
}



/*
 This is the Serializer class. It is placed here after the Parser which is the super class. See: http://stackoverflow.com/questions/24420500/typescript-error-runtime-error-cannot-read-property-prototype-of-undefined-wh data
 https://github.com/Microsoft/TypeScript/issues/5207 for more information
*/


export class Serializer extends Parser {
    constructor() {
        super();
    }

    //util method to obtain id from instance
    public static getId(value: Instance): string {
        return value.fmu.name + "." + value.name;
    }

    //util method to obtain full id from instance and scalarvariable
    public static getIdSv(value: Instance, sv: ScalarVariable): string {
        return value.fmu.name + "." + value.name + "." + sv.name;
    }
}
