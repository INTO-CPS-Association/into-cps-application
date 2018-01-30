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

import { CoSimulationConfig } from "./CoSimulationConfig"
import { MultiModelConfig } from "./MultiModelConfig"
import {
    ScalarVariable, Fmu, CausalityType, Instance, InstanceScalarPair, ScalarVariableType, VariabilityType,
    causalityToString, typeToString, variabilityToString, initialToString, InitialType
} from "../angular2-app/coe/models/Fmu"
import { CoeConfig } from "../angular2-app/coe/models/CoeConfig"
import IntoCpsApp from "./../IntoCpsApp";
import { Serializer } from "./Parser";
import * as fs from "fs"
import * as xml2js from 'xml2js';
import * as path from "path"

type valueReference = number;
type name = string;
declare var w2prompt: any;

class InstanceScalars {
    constructor(public instance: Instance, public ScalarVariables: ScalarVariable[]) { }
}


class XMLMD {
    public static GetXMLMD() {
        let parser = new DOMParser();
        let templatePath = path.join(__dirname, path.normalize("../resources/into-cps/model-description-template.xml"));

        let data = fs.readFileSync(templatePath).toString();
        let xml = parser.parseFromString(data, "text/xml");

        // Add all the outputs to ModelVariables and ModelStructure
        let modelVariables = xml.getElementsByTagName("ModelVariables")[0];
        let modelStructure = xml.getElementsByTagName("ModelStructure")[0];
        let mappings = xml.getElementsByTagName("Mappings")[0];
        let tool = xml.getElementsByTagName("Tool")[0];
        return new XMLMD(xml, modelVariables, modelStructure, mappings, tool);
    }
    constructor(public xmlDoc: Document, public modelVariables: Element, public modelStructure: Element, public mappings: Element, public tool: Element) {

    }

}

export class FmuImploder {

    public static createImplodeFMU(configPath: string) {
        let filename: string;
        let project = IntoCpsApp.getInstance().getActiveProject();
        let fmusPath = project.getFmusPath();
        let prompt = (title: string, value: string) => {
            w2prompt({
                label: 'Name',
                value: value,
                attrs: 'style="width: 500px"',
                title: title,
                ok_text: 'Ok',
                cancel_text: 'Cancel',
                width: 500,
                height: 200,
                callBack: function (cbVal: string) {
                    if (cbVal != null) {
                        if (cbVal.length > 0) {
                            let folderName = path.join(fmusPath, cbVal);
                            if (fs.existsSync(folderName)) {
                                prompt("Invalid implode FMU name", cbVal);
                            }
                            else {
                                fs.mkdirSync(folderName);
                                FmuImploder.implodeConfig(configPath, folderName);
                            }
                        }
                        else {
                            prompt("Invalid implode FMU name", cbVal);
                        }
                    }
                }
            });
        }
        prompt("Name for the imploded FMU", "implode");
    }

    private static implodeConfig(configPath: string, folderName: string) {
        let project = IntoCpsApp.getInstance().getActiveProject();
        let fmusPath = project.getFmusPath();
        CoSimulationConfig.parse(configPath, project.getRootFilePath(), project.getFmusPath()).then(config => {
            let flatten = <T>(acc: Array<T>, cur: Array<T>) => { return acc.concat(cur) };
            let externalFmuName = "{ext}";
            let externalFmuInst = "ext"
            let fmuInstances = config.multiModel.fmuInstances;

            /* If FMUs are added to a multimodel but not instances are created, then create one instance per fmu. */
            if (config.multiModel.fmuInstances.length === 0) {
                fmuInstances = new Array<Instance>();
                config.multiModel.fmus.forEach((x) => {
                    var count = 1;
                    fmuInstances.push(new Instance(x, `inst${count++}`))
                });
            }

            let conInputs: Array<ScalarVariable> = new Array<ScalarVariable>();
            fmuInstances.forEach((inst: Instance) => {
                var svs = new Array<ScalarVariable>();
                inst.outputsTo.forEach((instSvPairs: InstanceScalarPair[]) => {
                    instSvPairs.forEach((instSvPair) => {
                        svs.push(instSvPair.scalarVariable);
                    });
                });
                conInputs = conInputs.concat(svs)
            });

            // All outputs. Todo: Filter for connected outputs?
            var outputs: Array<InstanceScalars> = new Array<InstanceScalars>();
            // All unconnected inputs
            var unconInputs: Array<InstanceScalars> = new Array<InstanceScalars>();
            // To retrieve the outputs
            var logVariablesObj: { [k: string]: Array<string> } = {};

            fmuInstances.forEach((inst: Instance) => {
                var outputSVs_ = new Array<ScalarVariable>();
                var unconInputSVs = new Array<ScalarVariable>();

                inst.fmu.scalarVariables.forEach((sv: ScalarVariable) => {
                    if (sv.causality === CausalityType.Input && conInputs.indexOf(sv) === -1) {
                        unconInputSVs.push(sv);
                    }
                    else if (sv.causality == CausalityType.Output) {
                        outputSVs_.push(sv);
                    }
                });
                if (unconInputSVs.length > 0) {
                    unconInputs.push(new InstanceScalars(inst, unconInputSVs));
                }
                if (outputSVs_.length > 0) {
                    outputs.push(new InstanceScalars(inst, outputSVs_));
                    logVariablesObj[Serializer.getId(inst)] = outputSVs_.map(sv => sv.name);
                }
            });

            // Connections for the implosion configuration
            var implodeConns = FmuImploder.createConnections(externalFmuName + "." + externalFmuInst, unconInputs);
            // Implosion configuration
            var implodeConfig = { fmus: { [externalFmuName]: `external://external` }, connections: implodeConns, logVariables: logVariablesObj };
            let fmuFullPaths = new Array<String>();
            config.multiModel.fmus.forEach((x: Fmu) => {
                fmuFullPaths.push(x.path);
                x.path = path.basename(x.path);
            })
            // New coeconfig for the implosion FMU
            let coeConfig = new CoeConfig(config, false);
            console.log("COEConfig: \n " + coeConfig.toJSON(implodeConfig));
            let newConfig = coeConfig.toJSON(implodeConfig);

            console.log("MDInner:\n" + FmuImploder.createMDInner(unconInputs));
            console.log("MDCOE:\n" + FmuImploder.createMDCoe(unconInputs, outputs));
            let mdexternal = FmuImploder.createMDInner(unconInputs);
            let mdcoe = FmuImploder.createMDCoe(unconInputs, outputs);

            let resourcesFolder = path.join(folderName, "resources");
            fs.mkdirSync(resourcesFolder);
            let externalFolder = path.join(resourcesFolder, "external");
            fs.mkdirSync(externalFolder)
            fs.writeFileSync(path.join(folderName, "modelDescription.xml"), mdcoe);
            fs.writeFileSync(path.join(externalFolder, "modelDescription.xml"), mdexternal);
            fs.writeFileSync(path.join(resourcesFolder, "config.json"), newConfig);
            fmuFullPaths.forEach((fmu: string) => {
                fs.createReadStream(fmu).pipe(fs.createWriteStream(path.join(resourcesFolder, path.basename(fmu))));
            });
        });
    }

    private static createMDCoe(unconInputs: Array<InstanceScalars>, outputs: Array<InstanceScalars>) {
        var valueRef = 1;
        let xmlMD = XMLMD.GetXMLMD();
        let nestedElem = xmlMD.xmlDoc.createElement("Nested")
        xmlMD.mappings.appendChild(nestedElem);
        if (unconInputs.length > 0) {
            unconInputs.forEach((instSvs) => {
                instSvs.ScalarVariables.forEach((sv) => {
                    let xmlSV = FmuImploder.createScalarVariable(xmlMD.xmlDoc, instSvs.instance, sv, valueRef);

                    xmlMD.modelVariables.appendChild(xmlSV);
                    valueRef++;
                });
            });
        }
        if (outputs.length > 0) {
            let outputsElement = xmlMD.xmlDoc.createElement("Outputs");
            let mappings =
                outputs.forEach((instSvs) => {
                    instSvs.ScalarVariables.forEach((sv) => {
                        let xmlSV = FmuImploder.createScalarVariable(xmlMD.xmlDoc, instSvs.instance, sv, valueRef);
                        xmlMD.modelVariables.appendChild(xmlSV);

                        var link = xmlMD.xmlDoc.createElement("link");
                        link.setAttribute("valueReference", valueRef.toString());
                        link.setAttribute("name", Serializer.getIdSv(instSvs.instance, sv));
                        xmlMD.mappings.appendChild(link);

                        let xmlUnknown = FmuImploder.createUnknown(xmlMD.xmlDoc, valueRef);
                        outputsElement.appendChild(xmlUnknown);

                        valueRef++;
                    });
                });
            xmlMD.modelStructure.appendChild(outputsElement);
        }

        let serializer = new XMLSerializer();
        let serialized = serializer.serializeToString(xmlMD.xmlDoc);
        return serialized;
    }

    private static createMDInner(unconInputs: Array<InstanceScalars>) {
        let xmlMD = XMLMD.GetXMLMD();
        var valueRef = 1;
        if (unconInputs.length > 0) {
            let outputsElement = xmlMD.xmlDoc.createElement("Outputs");
            unconInputs.forEach((instSvs) => {

                instSvs.ScalarVariables.forEach((sv) => {
                    let xmlSV = FmuImploder.createScalarVariable(xmlMD.xmlDoc, instSvs.instance, sv, valueRef, true);
                    xmlMD.modelVariables.appendChild(xmlSV);
                    let xmlUnknown = FmuImploder.createUnknown(xmlMD.xmlDoc, valueRef);
                    outputsElement.appendChild(xmlUnknown);

                    valueRef++;
                });

                xmlMD.modelStructure.appendChild(outputsElement);
            });
        }
        else {
            let xmlSV = xmlMD.xmlDoc.createElement("ScalarVariable");
            xmlSV.setAttribute("name", "$internal");
            xmlSV.setAttribute("valueReference", "0");
            xmlSV.setAttribute("causality", "input");
            xmlSV.setAttribute("variability", variabilityToString(VariabilityType.Continuous));
            let typeChild = xmlMD.xmlDoc.createElement(typeToString(ScalarVariableType.Real));
            typeChild.setAttribute("start", "0.0");
            xmlSV.appendChild(typeChild);
            xmlMD.modelVariables.appendChild(xmlSV);
        }
        let serializer = new XMLSerializer();
        let serialized = serializer.serializeToString(xmlMD.xmlDoc);
        return serialized;

    }

    private static createScalarVariable(xml: Document, instance: Instance, sv: ScalarVariable, valueRef: number, isOutput: boolean = false) {
        let xmlSV = xml.createElement("ScalarVariable");
        xmlSV.setAttribute("name", Serializer.getIdSv(instance, sv));
        xmlSV.setAttribute("valueReference", valueRef.toString());
        if (isOutput)
            xmlSV.setAttribute("causality", "output");
        else
            xmlSV.setAttribute("causality", causalityToString(sv.causality));
        xmlSV.setAttribute("variability", variabilityToString(sv.variability));
        if (sv.initial)
            xmlSV.setAttribute("initial", initialToString(sv.initial));

        let typeChild = xml.createElement(typeToString(sv.type));
        if (sv.start) {
            typeChild.setAttribute("start", sv.start);
            if (isOutput && !sv.initial)
                xmlSV.setAttribute("initial", initialToString(InitialType.Approx));
        }
        xmlSV.appendChild(typeChild);
        return xmlSV;
    }

    private static createConnections(fmuName: string, inputs: Array<InstanceScalars>): { [k: string]: Array<string> } {

        var connections: { [k: string]: any } = {};

        if (inputs.length > 0)
            inputs.forEach((inp: InstanceScalars) => {
                inp.ScalarVariables.forEach((sv) => {
                    connections[`${fmuName}.${Serializer.getIdSv(inp.instance, sv)}`] = [`${Serializer.getIdSv(inp.instance, sv)}`]
                });
            });
        return connections;
    }

    private static createUnknown(xml: Document, index: number) {
        let xmlUnknown = xml.createElement("Unknown");
        xmlUnknown.setAttribute("index", index.toString());
        xmlUnknown.setAttribute("dependencies", "");
        return xmlUnknown;
    }

}
