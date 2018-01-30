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


import fs = require("fs");
import Path = require("path");
import {RTTester} from "../rttester/RTTester";


export function display(templateTP: string): void {
    let hModalTitle: HTMLHeadingElement = <HTMLHeadingElement>document.getElementById("modalTitle");
    let hCopyButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalCopy");
    let hTPName: HTMLInputElement = <HTMLInputElement>document.getElementById("TPName");
    let hModalFail: HTMLLabelElement = <HTMLLabelElement>document.getElementById("modalFail");

    let oldTP = RTTester.getRelativePathInProject(templateTP);
    let oldTPName = oldTP.split(Path.sep)[1];
    let prjDir = RTTester.getProjectOfFile(templateTP);
    hModalTitle.innerText = "Copy Test Procedure \"" + oldTPName + "\"";

    $('#modalDialog').on('shown.bs.modal', ()=> hTPName.focus());

    hTPName.addEventListener("input", () => {
        if (hTPName.value == "") {
            hModalFail.innerText = "";
            hModalFail.style.display = "none";
            hCopyButton.disabled = true;
        } else {
            let path = Path.join(prjDir, "TestProcedures", hTPName.value);
            fs.stat(path, (err: any, stats: fs.Stats) => {
                if (!err) {
                    hModalFail.innerText = "Invalid name for Test Procedure.";
                    hCopyButton.disabled = true;
                    hModalFail.style.display = "block";
                } else {
                    hModalFail.innerText = "";
                    hCopyButton.disabled = false;
                    hModalFail.style.display = "none";
                }
            });
        }
    });
    let copy = () => {
        let newTP = Path.join("TestProcedures", hTPName.value);
        let script = Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-copy-test.py");
        const spawn = require("child_process").spawn;
        let args: string[] = [
            script,
            oldTP,
            newTP
        ];
        let env: any = RTTester.genericCommandEnv(templateTP);
        const p = spawn(RTTester.pythonExecutable(), args, { env: env });
        p.stdout.on("data", (d: any) => console.log(d.toString()));
        p.stderr.on("data", (d: any) => console.log(d.toString()));
        (<any>$("#modalDialog")).modal("hide");
    };
    hCopyButton.addEventListener("click", (event: Event)=> copy());
    hTPName.addEventListener("keydown", (e) => {
        // enter key
        if (e.keyCode == 13 && !hCopyButton.disabled) {
            copy();
        }
    });
}

