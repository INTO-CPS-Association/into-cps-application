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
import { RTTester } from "../rttester/RTTester";
import fs = require("fs");


export class MCResultView extends ViewController {

    hReport: HTMLDivElement;
    rtt_testcontext: string;
    ltl_name: string;

    constructor(protected viewDiv: HTMLDivElement, resultFilePath: string) {
        super(viewDiv);
        this.rtt_testcontext = RTTester.getProjectOfFile(resultFilePath);
        this.ltl_name = Path.dirname(RTTester.getRelativePathInProject(resultFilePath));
        IntoCpsApp.setTopName(RTTester.getRelativePathInProject(resultFilePath));
        this.hReport = <HTMLDivElement>document.getElementById("report");
        let f: HTMLIFrameElement = document.createElement("iframe");
        f.src = resultFilePath;
        f.style.width = "100%";
        f.style.height = "100%";
        this.hReport.appendChild(f);
        {
            // Only show commit button if requirements are linked.
            let ltlQueryFileName = Path.join(Path.dirname(resultFilePath), "query.json");
            let data = fs.readFileSync(ltlQueryFileName, "utf-8");
            let json = JSON.parse(data);
            if (json["RequirementsToLink"].length == 0) {
                let hCommitPanel = <HTMLDivElement>document.getElementById("commitPanel");
                hCommitPanel.style.display = "none";
            }
        }
    }

    commit(): void {
        RTTester.queueEvent("Run-MC-Query", this.rtt_testcontext, this.ltl_name);
        RTTester.reportEvents(this.rtt_testcontext);
    }

}

