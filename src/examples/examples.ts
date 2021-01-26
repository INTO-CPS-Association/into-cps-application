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

import {IntoCpsApp} from  "../IntoCpsApp"
import {SettingKeys} from "../settings/SettingKeys";
import * as ProjectFetcher from "../proj/ProjectFetcher"

import Path = require('path');
import fs = require('fs');

import * as http from "http";
let request = require("request");
const dialog = require("electron").remote.dialog;


function launchProjectExplorer() {
    dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] }).then((res) => {
        var p: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
        p.value = res.filePaths[0];
    }).catch((error) => {
        console.error(error);
        return;
    });


}

window.onload = function () {

    var dest: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");
    dest.value = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.DEFAULT_PROJECTS_FOLDER_PATH);

    fetchExamples(IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.EXAMPLE_REPO)).then(json => {

        let ul = document.createElement("ul");
        ul.className = "list-group";

        let div: HTMLInputElement = <HTMLInputElement>document.getElementById("examples-div");
        div.appendChild(ul);

        json.examples.forEach((ex: any) => {
            let exDiv = document.createElement("li");
            exDiv.className = "list-group-item";
            exDiv.innerText = ex.name;
            exDiv.onclick = function () {
                var p: HTMLInputElement = <HTMLInputElement>document.getElementById("basic-url");
                p.value = ex.git;
                activateListItem(exDiv);
            };
            ul.appendChild(exDiv);
        });
    }).catch(err => console.error("Error in Window onload: " + err));
};

function fetchExamples(url: string) {
    return new Promise<any>((resolve, reject) => {
        // let data = new Stream<string>();
        request({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

function activateListItem(elem: any) {
    // get all 'a' elements
    var a = document.getElementsByTagName('li');
    // loop through all 'a' elements
    var i: number = 0;
    for (i = 0; i < a.length; i++) {
        // Remove the class 'active' if it exists
        a[i].classList.remove('list-group-item-info')
    }
    // add 'active' classs to the element that was clicked
    elem.classList.add('list-group-item-info');
}



function examples_open() {

    var p: HTMLInputElement = <HTMLInputElement>document.getElementById("basic-url");
    var dest: HTMLInputElement = <HTMLInputElement>document.getElementById("projectRootPathText");

    document.getElementById('openSpinner').style.display = "block";
    document.getElementById('container').style.display = "none";

    var progress = document.getElementById('progress');
    var progressBar = document.getElementById('progress-bar');

    ProjectFetcher.fetchProjectThroughGit(p.value, dest.value, (output:string) => {
        var percentage = ProjectFetcher.parsePercentage(output);

        if (percentage) {
            progressBar.style.width = percentage;
            progressBar.innerHTML = percentage;
        }

        progress.innerHTML = output.split("\n").pop();
    })
        .then(code => window.top.close()).catch(err => console.error("Error in closing: " + err));
}
