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


import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");
import fs = require("fs");
import { RTTester } from "../rttester/RTTester";
import { Abstractions, Interface, Input } from "./CTAbstractions";
import { Utilities } from "../utilities";
import { IntoCpsAppMenuHandler } from "../IntoCpsAppMenuHandler";
import * as ModalCommand from "./GenericModalCommand";

const dialog = require("electron").remote.dialog; 


export class CreateMCProjectController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    directory: string;
    hName: HTMLInputElement;
    hPath: HTMLInputElement;
    hBrowseButton: HTMLInputElement;
    hCreateButton: HTMLButtonElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, directory: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
        this.hName = <HTMLInputElement>document.getElementById("ProjectName");
        this.hPath = <HTMLInputElement>document.getElementById("XMIModelPathText");
        this.hBrowseButton = <HTMLInputElement>document.getElementById("browseButton");
        this.hCreateButton = <HTMLButtonElement>document.getElementById("createButton");
    };


    xmiModelBrowser() {
         dialog.showOpenDialog({
            filters: [{ name: "XMI-Files", extensions: ["xmi", "xml"] }]
        }).then((res) => {
            if(res.filePaths != undefined) {
                this.hPath.value = res.filePaths[0];
            }
        }).catch((error) => {
            console.error(error);
            return;
        });
    }

    createDefaultAbstractionsPromise(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let extractInterface = (onLoad: (interfaceJSON: string) => void) => {
                let script: string = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-into-extract-interface.py");
                const spawn = require("child_process").spawn;
                let pythonPath = RTTester.pythonExecutable();
                let args: string[] = [
                    script,
                    "--input",
                    xmiFileName
                ];
                let env: any = process.env;
                env["RTTDIR"] = RTTester.rttInstallDir();
                let stdout = "";
                const p = spawn(pythonPath, args, { env: env });
                p.stdout.on("data", (s: string) => { stdout += s; });
                p.stderr.on("data", c.appendLog.bind(c));
                p.on("close", (code: number) => {
                    if (code != 0) {
                        reject();
                    } else {
                        try {
                            let obj = JSON.parse(stdout);
                            onLoad(obj);
                            resolve();
                        } catch (e) {
                            c.appendLog("Problem when parsing interface description: " + e);
                            c.appendLog("Interface description was: " + stdout);
                            reject();
                        }
                    }
                });
            };
            let generateAbstractions = (interfaceJSON: any) => {
                let createInputs = (inputs: any[]): Input[] => {
                    return inputs.reduce((oList: any[], o: any) => {
                        let name = o[0];
                        let type = o[1];
                        oList.push({
                            name: name,
                            type: type,
                        });
                        return oList;
                    }, []);
                };
                let createInputInterfaces = (interfaces: any[]): Interface[] => {
                    return interfaces.reduce((iList: any[], i: any) => {
                        let name = i[0];
                        let type = i[1];
                        if (type == "input") {
                            let inputs = interfaceJSON["interfaces"][name][1];
                            iList.push({
                                name: name,
                                inputs: createInputs(inputs)
                            });
                        }
                        return iList;
                    }, []);
                };
                let createComponents = (): Abstractions => {
                    return {
                        components: Object.keys(interfaceJSON.components).map((compName: string) => {
                            return {
                                name: compName,
                                inputInterfaces: createInputInterfaces(interfaceJSON.components[compName]),
                            };
                        })
                    };
                };
                let abstractions = createComponents();
                Abstractions.writeToJSON(abstractions, Path.join(targetDir, "abstractions.json"));
            };
            extractInterface(generateAbstractions);
        });
    }

    createMCProject(c: ModalCommand.GenericModalCommand, xmiFileName: string, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let exe = RTTester.pythonExecutable();
            let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-create-fmi2-project.py");
            const spawn = require("child_process").spawn;
            let args: string[] = [
                script,
                "--skip-rttui",
                "--skip-configure",
                "--skip-tests",
                "--dir=" + targetDir,
                "--template=MC",
                xmiFileName
            ];
            let env: any = process.env;
            env["RTTDIR"] = RTTester.rttInstallDir();
            const p = spawn(exe, args, { env: env });
            p.stdout.on("data", c.appendLog.bind(c));
            p.stderr.on("data", c.appendLog.bind(c));
            p.on("exit", (code: number) => {
                if (code != 0) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    createSignalMap(c: ModalCommand.GenericModalCommand, targetDir: string) {
        return new Promise<void>((resolve, reject) => {
            let modelDir = Path.join(targetDir, "model");
            let exe = Path.join(RTTester.rttMBTInstallDir(), "bin", "sigmaptool");
            const spawn = require("child_process").spawn;
            let args: string[] = [
                "-projectDb", "model_dump.db"
            ];
            let env: any = process.env;
            const p = spawn(exe, args, { cwd: modelDir });
            p.stdout.on("data", c.appendLog.bind(c));
            p.stderr.on("data", c.appendLog.bind(c));
            p.on("exit", (code: number) => {
                if (code != 0) {
                    reject();
                } else {
                    Utilities.copyFile(
                        Path.join(modelDir, "signalmap.csv"),
                        Path.join(modelDir, "signalmap-with-interval-abstraction.csv"),
                        (error) => {
                            if (error) {
                                console.log(error);
                                reject();
                            } else {
                                resolve();
                            }
                        });
                }
            });
        });
    }

    createProject(): void {
        let self = this;
        let xmiFileName = this.hPath.value;
        let targetDir = Path.normalize(Path.join(this.directory, this.hName.value));
        let modelDetailsPath = Path.join(targetDir, "model", "model-details.html");
        let modelDetailsTitle = RTTester.getRelativePathInProject(modelDetailsPath);

        ModalCommand.load("Create Model Checking Project",
            (c: ModalCommand.GenericModalCommand) => {
                self.createMCProject(c, xmiFileName, targetDir).then(
                    () => self.createDefaultAbstractionsPromise(c, xmiFileName, targetDir).then(
                        () => self.createSignalMap(c, targetDir).then(
                            () => {
                                RTTester.queueEvent("Define-CT-Abstraction", targetDir);
                                c.displayTermination(true);
                                self.menuHandler.openHTMLInMainView(modelDetailsPath, modelDetailsTitle);
                            },
                            () => c.displayTermination(false)),
                        () => c.displayTermination(false)),
                    () => c.displayTermination(false)).catch(err => console.error("Error in creating project: " + err));
            });
    }




}

