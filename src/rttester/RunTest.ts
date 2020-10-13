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
import { RTTester } from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import Path = require("path");
import { IntoCpsAppMenuHandler } from "../IntoCpsAppMenuHandler";
const dialog = require("electron").remote.dialog;

class FMUAssignment {
    assignments: FMUAssignments;
    hInstanceName: HTMLHeadingElement;
    hFMUPath: HTMLInputElement;
    hRemoveButton: HTMLButtonElement;
    html: HTMLDivElement;
    constructor(assignments: FMUAssignments, fmuFileName: string) {
        this.assignments = assignments;
        let self: FMUAssignment = this;
        $("<div>").load("./rttester/RunTest/SUTSelection.html", function (event: JQueryEventObject) {
            self.html = <HTMLDivElement>(this);
            self.hInstanceName = this.querySelector("#name");
            self.hFMUPath = this.querySelector("#fmuPath");
            self.hFMUPath.value = fmuFileName;
            self.hRemoveButton = this.querySelector("#removeButton");
            self.hRemoveButton.addEventListener("click", () => {
                self.assignments.remove(self);
            });
            let JSZip = require("jszip");
            var fs = require('fs');
            fs.readFile(fmuFileName, function (err: any, data: any) {
                if (err)
                    throw err;
                JSZip.loadAsync(data).then(function (zip: any) {
                    return zip.file("modelDescription.xml").async("text");
                }).then(function (xml: string) {
                    let parser = new DOMParser();
                    let dom = parser.parseFromString(xml, "text/xml");
                    self.hInstanceName.innerText = dom.documentElement.getAttribute("modelName");
                });
            });
            self.assignments.add(self);
        });
    }
    getHTML(): HTMLDivElement {
        return this.html;
    }
}

class FMUAssignments {
    controller: RunTestController;
    hSUTList: HTMLDivElement;
    hAddFMUButton: HTMLButtonElement;
    fmus: FMUAssignment[] = [];
    constructor(controller: RunTestController) {
        this.controller = controller;
        this.hSUTList = <HTMLDivElement>document.getElementById("sutList");
        this.hAddFMUButton = <HTMLButtonElement>document.getElementById("addFMUButton");
        this.hAddFMUButton.addEventListener("click", () => {
             dialog.showOpenDialog({
                filters: [{ name: "FMU-Files", extensions: ["fmu"] }],
                defaultPath: RTTester.getProjectOfFile(controller.testCase)
            }).then(res => {
                if(res.filePaths != undefined) {
                    let fmu = new FMUAssignment(this, res.filePaths[0]);
                }
            }).catch(error => {
                console.error(error);
                return;
            });
        });
    }
    add(fmu: FMUAssignment) {
        this.fmus.push(fmu);
        this.hSUTList.appendChild(fmu.getHTML());
    }
    remove(fmu: FMUAssignment) {
        this.hSUTList.removeChild(fmu.getHTML());
        let idx = this.fmus.indexOf(fmu);
        if (idx != -1) {
            this.fmus.splice(idx, 1);
        }
    }
}

export class RunTestController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    testCase: string;
    fmuAssignments: FMUAssignments = new FMUAssignments(this);
    hRunButton: HTMLButtonElement;
    hEnableSignalViewer: HTMLInputElement;
    hStepSize: HTMLInputElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, testCase: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        let self = this;
        this.testCase = testCase;
        IntoCpsApp.setTopName("Run Test");
        this.hRunButton = <HTMLButtonElement>document.getElementById("runButton");
        this.hEnableSignalViewer = <HTMLInputElement>document.getElementById("enableSignalViewer");
        this.hStepSize = <HTMLInputElement>document.getElementById("stepSize");
        this.hRunButton.addEventListener("click", this.run.bind(self));
    };

    run() {
        if (this.hEnableSignalViewer.checked) {
            let script = Path.join(RTTester.rttInstallDir(), "bin", "rtt_live_sigplot.py");
            const spawn = require("child_process").spawn;
            const child = spawn(RTTester.pythonExecutable(),
                [script, "--line", "--corners", "--subplots", "--duplicates", "--keep-plotting"]);
        }
        let self = this;
        let python = RTTester.pythonExecutable();
        let rttTestContext = RTTester.getProjectOfFile(this.testCase);
        let runCOEScript = Path.join(RTTester.getUtilsPath(rttTestContext), "run-COE.py");
        let driverFMU = RTTester.getRelativePathInProject(this.testCase);
        let summaryPath = Path.join(this.testCase, "test-case-summary.html");
        let summaryTitle = RTTester.getRelativePathInProject(summaryPath);
        let cmd = {
            title: "Run Test",
            command: python,
            arguments: [
                runCOEScript,
                "--verbose",
                "--stepsize=" + this.hStepSize.value,
                "--timeout=auto",
                driverFMU],
            options: {
                env: RTTester.genericCommandEnv(this.testCase),
                cwd: rttTestContext
            },
            onSuccess: () => { self.menuHandler.openHTMLInMainView(summaryPath, summaryTitle) }
        };
        for (var fmuAssignment of this.fmuAssignments.fmus) {
            cmd.arguments.push(fmuAssignment.hFMUPath.value);
        }
        RTesterModalCommandWindow.runCommand(cmd);
    }

}

