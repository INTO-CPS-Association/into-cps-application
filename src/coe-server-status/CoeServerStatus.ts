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

import { IntoCpsApp } from "../IntoCpsApp";
import { SettingKeys } from "../settings/SettingKeys";
const { remote, ipcRenderer } = require("electron");
import * as Path from 'path';
import * as child_process from 'child_process'
import fs = require('fs');
import { CoeProcess } from "./CoeProcess"

var globalChild: any;
var intoCpsAppIns = IntoCpsApp.getInstance();
var killWindow = false;
var preventUnload = true;
window.onload = function () {
    launchCoe();
    //    if (window.location.search === "?data=autolaunch")
    //      launchCoe();
};

function hideBehaviour(ev: Event) {
    ev.returnValue = false;
    remote.getCurrentWindow().hide();
}

remote.getCurrentWindow().on('minimize', (ev: Event) => {
    hideBehaviour(ev);
})

window.onbeforeunload = (ev: Event) => {
    if (preventUnload) {
        var isqutting = intoCpsAppIns.isquitting;
        if (isqutting || killWindow) {
            if (globalChild) {
                ev.returnValue = false;
                killCoeCloseWindow();
            }
        }
        else {
            hideBehaviour(ev)
        }
    }
}

ipcRenderer.on("kill", () => {
    killWindow = true;
    window.close();
});





function killCoeCloseWindow() {
    if (globalChild) {
        var kill = require('tree-kill');
        kill(globalChild.pid, 'SIGKILL', (err: any) => {
            if (err) {
                remote.dialog.showErrorBox("Failed to close COE", "It was not possible to close the COE. Pid: " + globalChild.pid)
            }
            else {
                globalChild = null;
            }
            preventUnload = false;
            window.close();
        });
    }
}

function coeClose() {
    window.close();
}

function clearOutput() {
    let div = document.getElementById("coe-console-output");
    while (div != null && div.hasChildNodes()) {
        div.removeChild(div.firstChild);
    }
}

var activeDiv: HTMLDivElement;
var errorPrefix = ".";

function processOutput(data: string) {

    let div = <HTMLDivElement>document.getElementById("coe-console-output");
    let dd = (data + "").split("\n");

    dd.forEach(line => {
        if (line.trim().length != 0) {
            let m = document.createElement("span");
            m.innerHTML = line + "<br/>";
            if (line.indexOf("ERROR") > -1 || line.indexOf(errorPrefix) == 0)
                m.style.color = "rgb(255, 0, 0)";
            if (line.indexOf("WARN") > -1)
                m.style.color = "rgb(255, 165, 0)";
            if (line.indexOf("DEBUG") > -1)
                m.style.color = "rgb(0, 0, 255)";
            if (line.indexOf("TRACE") > -1 || line.indexOf("(resumed)") == 0)
                m.style.color = "rgb(128,128,128)";

            div.appendChild(m);
        }
    });


    if (div.childElementCount > 600)
        while (div.childElementCount > 5000 && div.hasChildNodes()) {
            div.removeChild(div.firstChild);
        }
    window.scrollTo(0, document.body.scrollHeight);
}

function launchCoe() {

    var coe = IntoCpsApp.getInstance().getCoeProcess();
    errorPrefix = coe.getErrorLogLinePrefix();

    //let root = document.getElementById("coe-console")
    activeDiv = <HTMLDivElement>document.getElementById("coe-console-output");
    while (activeDiv.hasChildNodes()) {
        activeDiv.removeChild(activeDiv.firstChild);
    }
    //let div = document.createElement("div");
    //div.id = "coe-console-output";
    //let panel = createPanel("Console", div);
    //root.appendChild(panel);
    let mLaunch = document.createElement("span");
    mLaunch.innerHTML = "Terminal args: java -jar " + coe.getCoePath() + "<br/>";
    //div.appendChild(mLaunch);
    //activeDiv = div;

    activeDiv.appendChild(mLaunch);

    coe.subscribe(processOutput)

    if (!coe.isLogRedirectActive()) {
        var sp = <HTMLSpanElement>document.getElementById("stream-status");
        sp.className = "glyphicon glyphicon-remove";
    }
    else {
        var sp = <HTMLSpanElement>document.getElementById("stream-status");
        sp.className = "glyphicon glyphicon-link";

    }
    if (!coe.isRunning()) {
        coe.start();
        var sp = <HTMLSpanElement>document.getElementById("stream-status");
        sp.className = "glyphicon glyphicon-link";
    }
}

function stopCoe() {
    var coe = IntoCpsApp.getInstance().getCoeProcess();
    if (coe.isRunning()) {
        coe.stop();
    }
}

function createPanel(title: string, content: HTMLElement): HTMLElement {
    var divPanel = document.createElement("div");
    divPanel.className = "panel panel-default";

    var divTitle = document.createElement("div");
    divTitle.className = "panel-heading";
    divTitle.innerText = title;

    var divBody = document.createElement("div");
    divBody.className = "panel-body";
    divBody.appendChild(content);

    divPanel.appendChild(divTitle);
    divPanel.appendChild(divBody);

    return divPanel;
}


