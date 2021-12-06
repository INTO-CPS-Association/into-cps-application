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

import * as fs from 'fs';
import Path = require("path");
let JSZip = require("jszip");
import { Utilities } from "../../../utilities"
import { NgZone } from '@angular/core';
import { reject } from 'bluebird';

// Holds information about a .fmu container
export class Fmu {
    platforms: string[] = [];
    scalarVariables: ScalarVariable[] = [];
    pathNotFound = true;
    logCategories: string[] = [];
    system_platform: string = Utilities.getSystemPlatform() + Utilities.getSystemArchitecture();
    nested = false;


    constructor(public name: string = "{FMU}", public path: string = "") {

    }

    public isNested() {return this.nested;}

    isSupported() {
        return !!this.platforms.find(x => x === this.system_platform);
    }

    public updatePath(path: string): Promise<Boolean | void> {
        this.path = path;
        this.scalarVariables.forEach(sv => sv.isConfirmed = false);
        this.platforms = [];
        try {
            return this.populate();
        } catch(err){ 
            console.log("Error in updating path: " + err); 
            this.pathNotFound = true;    
            return Promise.reject(err);}
        /* return this.populate().catch(() => this.pathNotFound = true); */
    }

    public populate(): Promise<void> {
        if (fs.lstatSync(this.path).isDirectory()) {
            return this.populateFromDir();
        } else {
            return this.populateFromZip();
        }
    }

    public populateFromDir(): Promise<void> {
        let self = this;

        // Get supported platforms
        fs.readdir(Path.join(self.path, "binaries"), function (err, items) {
            //See https://typescript.codeplex.com/workitem/2242 for reason of any usage.
            if( items != undefined)
            {
                self.platforms = items.map(x => self.convertToPlatform(x));
            }else
            {
                self.platforms = ["N/A"];
            }
        });

        let mdPath = Path.join(self.path, "modelDescription.xml")
        let checkFileExists = new Promise<void>(function (resolve, reject) {
            try {
                if (fs.accessSync(mdPath, fs.constants.R_OK) === null) {
                    reject();
                }
                self.pathNotFound = false;
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        //wrap readFile in a promise
        let fileReadPromise = new Promise<Buffer>(function (resolve, reject) {
            fs.readFile(mdPath, function (err, data) {
                if (err !== null) {
                    return reject(err);
                }
                resolve(data);
            });
        });

        return checkFileExists.then(() => {
            return fileReadPromise.then(data => {
                self.populateFromModelDescription(data.toString('UTF-8', 0, data.length));
            });
        }).catch(error => console.error("Error when popilating from model description: " + error));
    }
    private convertToPlatform(platform: string): string {
        let pl = platform.toLowerCase();
        switch (pl) {
            case "win32": return "windows32";
            case "win64": return "windows64";
            default: return pl;
        }
    }

    public populateFromZip(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                if (fs.accessSync(this.path, fs.constants.R_OK) === null)
                    return reject();

                fs.readFile(this.path, (err, data) => {
                    if (err)
                        return reject(err);

                    var zip = new JSZip();

                    zip
                        .loadAsync(data)
                        .then(() => {
                            this.pathNotFound = false;

                            // Get platform names
                            this.platforms = zip
                                .file(/^binaries\/[a-zA-Z0-9]+\/.+/)
                                .map((folder: any) => this.convertToPlatform(folder.name.split('/')[1]));

                            zip.file("modelDescription.xml").async("string")
                                .then((content: string) => {
                                    this.populateFromModelDescription(content);
                                    resolve();
                                });
                        });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private populateFromModelDescription(content: string) {
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(content, "text/xml");

        // Check for nested coe
        let test = document.evaluate('//Nested', oDOM, null, XPathResult.BOOLEAN_TYPE, null);
        if(test.booleanValue === true)
            this.nested = true;

        //output
        var iterator = document.evaluate('//ScalarVariable', oDOM, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        var thisNode: Element = iterator.iterateNext() as Element;

        while (thisNode) {

            let causalityNode = thisNode.attributes.getNamedItem("causality");
            let variabilityNode = thisNode.attributes.getNamedItem("variability");
            let nameNode = thisNode.attributes.getNamedItem("name");
            let initialNode = thisNode.attributes.getNamedItem("initial");
            var type: ScalarVariableType;

            var tNode: Element = document.evaluate('Real', thisNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;

            if (tNode != null) {
                type = ScalarVariableType.Real;
            } else {
                tNode = document.evaluate('Boolean', thisNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
                if (tNode != null) {
                    type = ScalarVariableType.Bool;
                } else {
                    tNode = document.evaluate('Integer', thisNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
                    if (tNode != null) {
                        type = ScalarVariableType.Int;
                    } else {
                        tNode = document.evaluate('String', thisNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as Element;
                        if (tNode != null) {
                            type = ScalarVariableType.String;
                    }
                    }
                }
            }
            let start: string;
            if(tNode.hasAttributes())
            {
                let startAttribute = tNode.attributes.getNamedItem("start");
                if(startAttribute)
                    start = startAttribute.textContent;
            }

            let causality: CausalityType;

            if (causalityNode != undefined) {
                let causalityText = causalityNode.textContent;

                if ("output" == causalityText) {
                    causality = CausalityType.Output;
                }
                else if ("input" == causalityText) {
                    causality = CausalityType.Input;
                }
                else if ("parameter" == causalityText) {
                    causality = CausalityType.Parameter;
                }
                else if ("calculatedParameter" == causalityText) {
                    causality = CausalityType.CalculatedParameter;
                }
                else if ("local" == causalityText) {
                    causality = CausalityType.Local;
                }
                else if ("independent" == causalityText) {
                    causality = CausalityType.Independent;
                }
            }

            let variability: VariabilityType;
            if (variabilityNode != undefined) {
                let variabilityText = variabilityNode.textContent;
                if ("constant" == variabilityText) {
                    variability = VariabilityType.Constant;
                } else if ("continuous" == variabilityText) {
                    variability = VariabilityType.Continuous
                } else if ("discrete" == variabilityText) {
                    variability = VariabilityType.Discrete
                } else if ("fixed" == variabilityText) {
                    variability = VariabilityType.Fixed
                } else if ("tunable" == variabilityText)
                {
                    variability = VariabilityType.Tunable;
                }
            }

            let initial: InitialType;
            if(initialNode != undefined)
            {
                let initialText = initialNode.textContent;
                if("exact" == initialText)
                {
                    initial = InitialType.Exact;
                } else if ("approx" == initialText)
                {
                    initial = InitialType.Approx
                } else if ("calculated" == initialText)
                {
                    initial = InitialType.Calculated
                }
            }

            let sv = this.getScalarVariable(nameNode.textContent);
            sv.type = type;
            sv.causality = causality;
            sv.isConfirmed = true;
            sv.variability = variability;
            sv.start = start;
            sv.initial = initial;

            thisNode = iterator.iterateNext() as Element;
        }

        this.scalarVariables.sort((a, b) => a.name.localeCompare(b.name));


        iterator = document.evaluate('fmiModelDescription/LogCategories/*[@name]/@name', oDOM, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        thisNode = iterator.iterateNext() as Element;

        while (thisNode) {
            this.logCategories.push(thisNode.nodeValue);
            thisNode = iterator.iterateNext() as Element;
        }

        this.logCategories.sort((a, b) => a.localeCompare(b));
    }

    public getScalarVariable(name: string): ScalarVariable {
        let scalar = this.scalarVariables.find(s => s.name == name);

        if (!scalar) {
            scalar = new ScalarVariable(name);
            this.scalarVariables.push(scalar);
        }

        return scalar;
    }
}

// Represents a FMI ScalarVariable
export class ScalarVariable {
    constructor(
        public name: string = "",
        public type: ScalarVariableType = ScalarVariableType.Unknown,
        public causality: CausalityType = CausalityType.Unknown,
        public variability: VariabilityType = VariabilityType.Unknown,
        public initial: InitialType = InitialType.Unknown,
        public start: string = undefined,
        public isConfirmed: boolean = false // none FMI specific
    ) {

    }
}

export enum ScalarVariableType { Real, Bool, Int, String, Unknown }
export function typeToString(type: ScalarVariableType) {
    switch (type) {
        case ScalarVariableType.Real:
            return "Real";
        case ScalarVariableType.Bool:
            return "Boolean";
        case ScalarVariableType.Int:
            return "Integer";
        case ScalarVariableType.String:
            return "String";
        case ScalarVariableType.Unknown:
            return "unknown";
    }
}

export enum CausalityType { Output, Input, Parameter, CalculatedParameter, Local, Independent, Unknown }

export function causalityToString(causality: CausalityType) {
    switch (causality) {
        case CausalityType.Output:
            return "output";
        case CausalityType.Input:
            return "input";
        case CausalityType.Parameter:
            return "parameter";
        case CausalityType.CalculatedParameter:
            return "calculatedParameter";
        case CausalityType.Local:
            return "local";
        case CausalityType.Independent:
            return "independent";
        case CausalityType.Unknown:
            return "unknown";
    }
}

export enum InitialType {Exact, Approx, Calculated, Unknown}
export function initialToString(initial: InitialType) {
    switch(initial){
        case InitialType.Exact: return "exact";
        case InitialType.Approx: return "approx";
        case InitialType.Calculated: return "calculated";
        case InitialType.Unknown: return "unknown";
    }

}

export enum VariabilityType { Constant, Fixed, Tunable, Continuous, Discrete,  Unknown }
export function variabilityToString(variability: VariabilityType) {
    switch (variability) {
        case VariabilityType.Constant: return "constant";
        case VariabilityType.Fixed: return "fixed";
        case VariabilityType.Tunable: return "tunable";
        case VariabilityType.Continuous: return "continuous";
        case VariabilityType.Discrete: return "discrete";
        case VariabilityType.Unknown: return "unknown";
    }
}

export function isTypeCompatiple(t1: ScalarVariableType, t2: ScalarVariableType): boolean {
    if (t1 == ScalarVariableType.Unknown || t2 == ScalarVariableType.Unknown) {
        return true;
    } else if (t1 == ScalarVariableType.Bool && (t2 == ScalarVariableType.Int || t2 == ScalarVariableType.Real)) {
        // bool -> number
        return true;
    } else if (t2 == ScalarVariableType.Bool && (t1 == ScalarVariableType.Int || t1 == ScalarVariableType.Real)) {
        //number -> bool
        return true;
    } else {
        return t1 == t2;
    }
}

export function isCausalityCompatible(t1: CausalityType, t2: CausalityType): boolean {
    if (t1 == CausalityType.Unknown || t2 == CausalityType.Unknown) {
        return true;
    }
    else {
        return t1 == t2;
    }
}

export function isInteger(x: any) { return !isNaN(x) && isFinite(x) && Math.floor(x) === x; }
export function isFloat(x: any) { return !!(x % 1); }
export function isString(value: any) { return typeof value === 'string'; }


export function convertToType(type: ScalarVariableType, value: any): any {
    if (type == ScalarVariableType.Bool) {
        return Boolean(value);
    }
    else if (type == ScalarVariableType.Int) {
        let mValue = Number(value);
        if (isInteger(mValue)) {
            return mValue;
        }
    }
    else if (type == ScalarVariableType.Real) {
        let mValue = Number(value);
        if (isFloat(mValue) || isInteger(mValue)) {
            return mValue;
        }
    }
    else if (type == ScalarVariableType.String) {
        let mValue = value.toString();
        if (isString(mValue)) {
            return mValue;
        }
    }

    return null;
}

export function isTypeCompatipleWithValue(t1: ScalarVariableType, value: any): boolean {
    switch (t1) {
        case ScalarVariableType.Unknown:
            return true;
        case ScalarVariableType.Real:
            return isFloat(value) || isInteger(value);
        case ScalarVariableType.Bool:
            return typeof (value) === "boolean" || isInteger(value);
        case ScalarVariableType.Int:
            return isInteger(value);
        case ScalarVariableType.String:
            return isString(value);
    }
    return false;
}

// Repersents an instance of an FMU, including initial parameters and a mapping from outputs to InstanceScalarPair
export class Instance {
    //mapping from output to FmuConnection where connection holds an instane and input scalarVariable
    outputsTo: Map<ScalarVariable, InstanceScalarPair[]> = new Map<ScalarVariable, InstanceScalarPair[]>();

    // initial parameter values
    initialValues: Map<ScalarVariable, any> = new Map<ScalarVariable, any>();

    constructor(public fmu: Fmu, public name: string) {

    }

    public addOutputToInputLink(source: ScalarVariable, target: InstanceScalarPair) {
        if (this.outputsTo.has(source)) {
            let list = this.outputsTo.get(source);
            let match = list.find(pair => pair.instance == target.instance && pair.scalarVariable == target.scalarVariable);

            if (!match) list.push(target);
        } else {
            this.outputsTo.set(source, [target]);
        }
    }
}

// Represents a link pair (FmuInstances, scalarVariable)
export class InstanceScalarPair {
    constructor(public instance: Instance, public scalarVariable: ScalarVariable) {

    }
}

// Represents a parameter-value pair (ScalarVariable, any)
export class ScalarValuePair {
    constructor(public scalarVariable: ScalarVariable, public value: any) {

    }
}

// Represents an output-connections pair (ScalarVariable, any)
export class OutputConnectionsPair {
    constructor(public name: string, public connections: InstanceScalarPair[]) {

    }
}
