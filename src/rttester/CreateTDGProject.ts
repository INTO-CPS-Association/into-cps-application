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


import {ViewController} from "../iViewController";
import {IntoCpsApp} from "../IntoCpsApp";
import Path = require("path");
import {RTTester} from "../rttester/RTTester";
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import {IntoCpsAppMenuHandler} from "../IntoCpsAppMenuHandler";

const dialog = require("electron").remote.dialog;

export class CreateTDGProjectController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    directory: string;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, directory: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.directory = directory;
        IntoCpsApp.setTopName("RT-Tester Project");
    };

    xmiModelBrowser() {
         dialog.showOpenDialog({
            filters: [{ name: "XMI-Files", extensions: ["xmi", "xml"] }]
        }).then((res) => {
            if(res.filePaths != undefined) {
                let hText: HTMLInputElement = <HTMLInputElement>document.getElementById("XMIModelPathText");
                hText.value = res.filePaths[0];
            } 
        }).catch((error) => {
            console.error(error);
            return;
        });
    }

    createProject(): void {
        let self = this;
        let xmiPath = (<HTMLInputElement>document.getElementById("XMIModelPathText")).value;
        let projectName = (<HTMLInputElement>document.getElementById("ProjectName")).value;
        let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-create-fmi2-project.py");
        let targetDir = Path.normalize(Path.join(self.directory, projectName));
        let env: any = process.env;
        let modelDetailsPath = Path.join(targetDir, "model", "model-details.html");
        let modelDetailsTitle = RTTester.getRelativePathInProject(modelDetailsPath);
        env["RTTDIR"] = RTTester.rttInstallDir();
        let cmd = {
            title: "Create Test Automation Project",
            command: RTTester.pythonExecutable(),
            arguments: [
                script,
                "--dir=" + targetDir,
                "--skip-rttui",
                xmiPath
            ],
            options: { env: env },
            onSuccess: () => { self.menuHandler.openHTMLInMainView(modelDetailsPath, modelDetailsTitle) }
        };
        RTesterModalCommandWindow.runCommand(cmd);
    }

}

