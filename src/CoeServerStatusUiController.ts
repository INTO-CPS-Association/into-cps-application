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

import { IntoCpsApp } from "./IntoCpsApp";
import { CoeProcess } from "./coe-server-status/CoeProcess"
import {remote} from "electron";

export enum UICrtlType {Console, Log};

export class CoeServerStatusUiController {

    protected type: UICrtlType = UICrtlType.Console;
    private outputDiv: HTMLDivElement = null; //coe-console-output

    activeDiv: HTMLDivElement;
    errorPrefix = ".";
    coeStatusRunning = false;
    bottomElement: any = null;
    isSubscribed = false;
    buffer: DocumentFragment = new DocumentFragment();
    coeLogStartLine: string;
    coeLogStartLineIsSet = false;
    public static readonly maxLines: number = 5000;

    constructor(outputDiv: HTMLDivElement) {
        this.outputDiv = outputDiv;
    }
    
    public clearOutput() {
        let div = this.outputDiv;
        while (div != null && div.hasChildNodes()) {
            div.removeChild(div.firstChild);
        }
    }

    protected processOutput(data: string, skip: boolean) {
        let endsWithNewline: boolean = data.endsWith("\n");
        let dd = data.split("\n");

        dd.forEach((line, idx, array) => {
            if (line.trim().length != 0) {
                // If it is the last line and it does not end with a newline, then save it for next print.
                if (idx === array.length - 1 && endsWithNewline === false) {
                    this.coeLogStartLine = line;
                    this.coeLogStartLineIsSet = true;
                }
                else {
                    let m = document.createElement("span");
                    if (!skip) {
                        if (idx === 0 && this.coeLogStartLineIsSet) {
                            m.innerHTML = this.coeLogStartLine;
                            this.coeLogStartLineIsSet = false;
                        }
                        m.innerHTML = m.innerHTML.concat(`${line} <br/>`);
                        if (line.indexOf("ERROR") > -1 || line.indexOf(this.errorPrefix) == 0)
                            m.style.color = "rgb(255, 0, 0)";
                        if (line.indexOf("WARN") > -1)
                            m.style.color = "rgb(255, 165, 0)";
                        if (line.indexOf("DEBUG") > -1)
                            m.style.color = "rgb(0, 0, 255)";
                        if (line.indexOf("TRACE") > -1)
                            m.style.color = "rgb(128,128,128)";
                    }
                    else {
                        // This case skips the first line in case skip is true.
                        skip = false;
                        m.innerHTML = m.innerHTML.concat(`Skipped part of the log <br\>`);
                    }
                    this.buffer.appendChild(m);
                }
            }
        });

        this.outputDiv.appendChild(this.buffer);
        this.buffer = new DocumentFragment();
    }

    private setStatusIcons() {
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        var ss = <HTMLSpanElement>document.getElementById("stream-status");

        if (coe.isLogRedirectActive() && coe.isRunning()) {
            ss.className = "glyphicon glyphicon-link";
        } else {
            ss.className = "glyphicon glyphicon-remove";
        }

        var os = <HTMLSpanElement>document.getElementById("online-status");
        //console.log(`CoeServerStatusUiController - isRunnig: ${coe.isRunning()}`)
        os.style.color = coe.isRunning() ? "green" : "red";

        var btnLaunch = <HTMLButtonElement>document.getElementById("coe-btn-launch");
        btnLaunch.disabled = coe.isRunning();
        var btnStop = <HTMLButtonElement>document.getElementById("coe-btn-stop");
        btnStop.disabled = !coe.isRunning();
    }

    consoleAutoScroll() {
        let div = this.outputDiv;
        if (!$(div).is(":visible"))
            return;
        if (this.bottomElement == div.lastChild || div.lastChild == null)
            return
        this.bottomElement = div.lastChild;
        (<HTMLSpanElement>div.lastChild).scrollIntoView();
    }

    protected truncateVisibleLog() {
        if (this.outputDiv.childElementCount > CoeServerStatusUiController.maxLines) {
            while (this.outputDiv.childElementCount > CoeServerStatusUiController.maxLines && this.outputDiv.hasChildNodes()) {
                this.outputDiv.removeChild(this.outputDiv.firstChild);
            }
            let m = document.createElement("span");
            m.innerHTML = m.innerHTML.concat(`Truncated part of the log <br\>`);
            m.style.color = "rgb(128,128,128)";
            this.outputDiv.insertBefore(m, this.outputDiv.firstChild);
        }
    }

    protected prepareSimulationCallback() {
        return () => this.clearOutput();
    }

    public async bind() {
        if (this.isSubscribed)
            return;

        var coe = IntoCpsApp.getInstance().getCoeProcess();
        this.errorPrefix = coe.getErrorLogLinePrefix();
        coe.subscribe((line: any, skip: boolean) => { this.processOutput(line, skip) })
        let index = coe.subscribePrepareSimulationCallback(this.type, this.prepareSimulationCallback());
        this.isSubscribed = true;
        this.setStatusIcons();

        if (!this.coeStatusRunning) {
            window.setInterval(() => { this.setStatusIcons(); this.truncateVisibleLog() }, 3000);
            window.setInterval(() => { this.consoleAutoScroll() }, 800);
            this.coeStatusRunning = true;
        }
        window.addEventListener("beforeunload",(ev) => {
            remote.getCurrentWindow().removeAllListeners();
            coe.unloadPrintView(this.type);
        });
        window.onbeforeunload = ((ev) => {
            
         });
    }

    public launchCoe() {

        this.activeDiv = this.outputDiv;
        while (this.activeDiv.hasChildNodes()) {
            this.activeDiv.removeChild(this.activeDiv.firstChild);
        }

        var coe = IntoCpsApp.getInstance().getCoeProcess();
        let mLaunch = document.createElement("span");
        mLaunch.innerHTML = "Terminal args: java -jar " + coe.getCoePath() + "<br/>";

        this.activeDiv.appendChild(mLaunch);

        this.bind();


        if (!coe.isRunning()) {
            coe.start();
        }
    }

    public stopCoe() {
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        if (coe.isRunning()) {
            coe.stop();
        }
    }

}

export class CoeLogUiController extends CoeServerStatusUiController {

    protected type: UICrtlType = UICrtlType.Log;

    public async bind() {
        if (this.isSubscribed)
            return;
        var coe = IntoCpsApp.getInstance().getCoeProcess();
        coe.subscribeLog4J((line: any, skip: boolean) => { this.processOutput(line, skip) })
        let index = coe.subscribePrepareSimulationCallback(this.type, this.prepareSimulationCallback());
        window.setInterval(() => { this.truncateVisibleLog() }, 3000);
        this.isSubscribed = true;
        window.setInterval(() => { this.consoleAutoScroll() }, 800);
        window.addEventListener("beforeunload",(ev) => {
            remote.getCurrentWindow().removeAllListeners();
            coe.unloadPrintView(this.type);

        });
    }
}






















