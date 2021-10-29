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

import { IntoCpsApp } from "../IntoCpsApp"
import { SettingKeys } from "../settings/SettingKeys";
import { DialogHandler } from "../DialogHandler";

import Path = require('path');
import fs = require('fs');

import downloader = require("../downloader/Downloader");

const dialog = require("electron").remote.dialog;

const BrowserWindow = require('electron').remote.BrowserWindow;

function scrollIntoView(eleID: any) {
    var e = document.getElementById(eleID);
    if (!!e && e.scrollIntoView) {
        e.scrollIntoView();
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

function getTempDir(): string {
    let tempDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);
    if (tempDir == null || tempDir == undefined) {
        if (IntoCpsApp.getInstance().getActiveProject() == null) {
            dialog.showErrorBox("No active project", "No Active project loaded, please load and try again.");
            return;
        }
        tempDir = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "downloads");
    }
    try {
        // fs.mkdirSync(tempDir);
        var mkdirp = require('mkdirp');
        mkdirp.sync(tempDir);
    } catch (e) {
        console.error(e);
    }
    return tempDir;
}

function progress(state: any) {
    if (state == 1) {
        setProgress(100);
        return;
    }
    let pct = parseInt((state.percentage * 100) + "", 10);
    console.log(pct + "%");
    setProgress(pct);
}

//Set the progress bar 
function setProgress(progress: number) {
    var divProgress = <HTMLInputElement>document.getElementById("coe-progress");
    let tmp = progress.toString() + "%";

    divProgress.style.width = tmp;
    divProgress.innerHTML = tmp;
}

window.onload = function () {
    fetchList();
}

function fetchList() {

    let settings = IntoCpsApp.getInstance().getSettings();
    console.log(settings);
    var url = settings.getValue(SettingKeys.UPDATE_SITE);
    if (url == null || url == undefined) {
        url = "https://raw.githubusercontent.com/into-cps/release-site/master/download/";
        settings.setValue(SettingKeys.UPDATE_SITE, url);

    }

    if (settings.getValue(SettingKeys.USE_LOCAL_UPDATE_SITE) && settings.getValue(SettingKeys.LOCAL_UPDATE_SITE) != "") {
        url = settings.getValue(SettingKeys.LOCAL_UPDATE_SITE);
    }

    if (!(url + "").endsWith("/")) {
        url = url + "/";
    }

    var panel: HTMLInputElement = <HTMLInputElement>document.getElementById("tool-versions-panel");

    while (panel.hasChildNodes()) {
        panel.removeChild(panel.lastChild);
    }

    downloader.fetchVersionList(url + "versions.json").then(data => {
        //   console.log(JSON.stringify(data) + "\n");
        //   console.log("Fetching version 0.0.6");

        var versions: string[] = [];

        var divVersions = document.createElement("div");

        $.each(Object.keys(data), (j, key) => {
            let version = key;
            versions.push(version);
        });

        //sort
        versions = versions.sort(downloader.compareVersions);
        //highest version first
        versions = versions.reverse();


        var divVersions = document.createElement("div");

        versions.forEach(version => {
            var divStatus = document.createElement("div");
            divStatus.className = "alert alert-info";

            divStatus.innerHTML = version;/// +" - "data[version];
            divStatus.onclick = function (e) {
                downloader.fetchVersion(url + data[version]).then(dataVersion => {
                    
                    showVersion(version, dataVersion);
                });
            };


            divVersions.appendChild(divStatus);
        });


        panel.appendChild(createPanel("Releases", divVersions));
        //return downloader.fetchVersion(data[versions[0]]);
    }).catch(error => console.error("Error in fetching version list: " + error));

}

function createButton(): HTMLButtonElement {
    let btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-default btn-sm";
    return btn;
}

function showVersion(version: string, data: any) {

    var panel: HTMLInputElement = <HTMLInputElement>document.getElementById("tool-versions-panel");

    var div = document.createElement("ul");
    div.className = "list-group";
    $.each(Object.keys(data.tools), (j, key) => {

        let tool = data.tools[key];

        var supported = false;
        let platform = downloader.getSystemPlatform();
        let platforms = tool.platforms;
        if ("any" in platforms) {
            supported = true
        }
        else {
            Object.keys(tool.platforms).forEach(pl => {
                if (pl.indexOf(platform) == 0) {
                    supported = true;
                }
            });
        }
        if (!supported)
            return;

        var divTool = document.createElement("li");
        divTool.className = "list-group-item";
        divTool.innerText = tool.name + " - " + tool.description + " (" + tool.version + ") ";
        div.appendChild(divTool);

        let btn = createButton();
        var icon = document.createElement("span");
        icon.className = "glyphicon glyphicon-save";
        btn.appendChild(icon);
        divTool.appendChild(btn);
        var progressDiv = <HTMLDivElement>document.getElementById("progress-bars");

        let progressFunction = (downloadName: string, component: HTMLDivElement) => {
            let setProgress = (progress: number) => {
                let styleWidth = progress.toString() + "%";
                let downloadText = styleWidth + " - " + downloadName;

                component.style.width = styleWidth;
                component.innerHTML = downloadText;
            }
            return (state: any) => {
                if (state == 1) {
                    setProgress(100);
                    return;
                }
                let pct = parseInt((state.percentage * 100) + "", 10);
                console.log(pct + "%");
                setProgress(pct);
            }
        }

        btn.onclick = function (e) {
            const currentWindow = BrowserWindow.getFocusedWindow() //this window
            let buttons: string[] = ["No", "Yes"];
            dialog.showMessageBox(currentWindow, { type: 'question', buttons: buttons, message: "Download: " + tool.name + " (" + tool.version + ")" }).then(function(button: any) {
                if(button.response == 1)// yes
                {
                    // console.log(res.response);
                    $("<div>").load("./progress-bar-component.html", function (event: JQueryEventObject) {
                        let progressBarComponent = <HTMLDivElement>(<HTMLDivElement>this).firstElementChild;
                        //Prepend the child
                        if (progressDiv.hasChildNodes) {
                            progressDiv.insertBefore(progressBarComponent, progressDiv.firstChild)
                        }
                        else { progressDiv.appendChild(progressBarComponent); }

                        //Get the filling div
                        let component = <HTMLDivElement>(<HTMLDivElement>progressBarComponent).querySelector("#coe-progress");
                        component.scrollIntoView();
                        //Start the download
                        downloader.downloadTool(tool, getTempDir(), progressFunction(tool.name, component)).then(function (filePath) {
                            console.log("Download complete: " + filePath);
                            const { shell } = require('electron');

                            if (downloader.checkToolAction(tool, downloader.DownloadAction.UNPACK)) {
                                let installDirectory = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_DIR)
                                downloader.unpackTool(filePath, installDirectory);
                                shell.showItemInFolder(installDirectory);
                            } else if (downloader.checkToolAction(tool, downloader.DownloadAction.LAUNCH)) {
                               let launch = dialog.showMessageBox(currentWindow, { type: 'question', buttons: buttons, message: "Accept launch of installer: " + Path.basename(filePath) + " downloaded for: " + tool.name + " (" + tool.version + ")" }) 
                               launch.catch((error: Error) => {
                                   console.error(error);
                                   return;
                               });
                               launch.then((res) => {
                                   if(res.response === 1)//yes
                                    {
                                    shell.openExternal(filePath);
                                   }
                               });

                            } else if (downloader.checkToolAction(tool, downloader.DownloadAction.SHOW)) {
                                shell.showItemInFolder(filePath);
                            } else if (downloader.checkToolAction(tool, downloader.DownloadAction.NONE)) {
                                //do nothing
                            } else {
                                dialog.showMessageBox(currentWindow, { type: 'info', buttons: ["OK"], message: "Download completed: " + filePath });
                            }
                        }, function (error) { dialog.showErrorBox("Invalid Checksum", error); });
                    });
                } 
                // console.log(res.response);
            }).catch(err => console.error("Error in handling download manager dialog: " + err));
            // dialog end

        };
        let releasePage = tool.releasepage;
        if (releasePage) {
            let btn = createButton();
            var t = document.createTextNode("Release page");
            btn.appendChild(t);
            let dh = new DialogHandler(releasePage, 640, 400);
            dh.externalUrl = true;
            divTool.appendChild(btn);
            btn.onclick = function (e) {
                dh.openWindow();
            };
        }
    });

    var divT = document.getElementById("toolsversion");
    if (divT == undefined) {
        divT = document.createElement("div");
        divT.id = "toolsversion";
        panel.appendChild(divT);
    }

    while (divT.hasChildNodes()) {
        divT.removeChild(divT.lastChild);
    }

    divT.appendChild(createPanel("Overview - Release: " + data.version, div));
    divT.scrollIntoView();
}

