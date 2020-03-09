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

export function display(dir: string): void {
    let hAddButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("modalAdd");
    let hQueryName: HTMLInputElement = <HTMLInputElement>document.getElementById("QueryName");
    let hModalFail: HTMLLabelElement = <HTMLLabelElement>document.getElementById("modalFail");

    $('#modalDialog').on('shown.bs.modal', ()=> hQueryName.focus());
    hQueryName.addEventListener("input", () => {
        if (hQueryName.value == "") {
            hModalFail.innerText = "";
            hModalFail.style.display = "none";
            hAddButton.disabled = true;
        } else {
            let path = Path.join(dir, hQueryName.value);
            fs.stat(path, (err: any, stats: fs.Stats) => {
                if (!err) {
                    hModalFail.innerText = "Invalid name for LTL query.";
                    hAddButton.disabled = true;
                    hModalFail.style.display = "block";
                } else {
                    hModalFail.innerText = "";
                    hAddButton.disabled = false;
                    hModalFail.style.display = "none";
                }
            });
        }
    });
    let create = () => {
        let ltlDir = Path.join(dir, hQueryName.value);
        let err = fs.mkdirSync(ltlDir);
        if (err === undefined || null) {
            hModalFail.innerText = "Error creating folder '" + ltlDir + "'.";
            hModalFail.style.display = "block";
            return;
        }
        // Add empty LTL formula.
        let jsonObject = {
            BMCSteps: 50,
            ltlFormula: "",
            RequirementsToLink: <string[]>[],
            TracabilityLink: "verifies"
        };
        let queryFileName = Path.join(ltlDir, "query.json");
        err = fs.writeFileSync(queryFileName, JSON.stringify(jsonObject, null, 4));
        if (err ===  undefined || null) {
            hModalFail.innerText = "Error writing query file '" + queryFileName + "'.";
            hModalFail.style.display = "block";
            return;
        }
        (<any>$("#modalDialog")).modal("hide");
    };
    hAddButton.addEventListener("click", (event: Event) => create());
    hQueryName.addEventListener("keydown", (e) => {
        // enter key
        if (e.keyCode == 13 && !hAddButton.disabled) {
            create();
        }
    });
}

