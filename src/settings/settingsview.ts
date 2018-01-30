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

import * as IntoCpsApp from "../IntoCpsApp"
import { SettingKeys } from "./SettingKeys";
import { TextInputNonLoad, TextInputIds } from "../components/text-input-non-load";
import { Settings } from "./settings";
import { Component } from "../components/component";

class SettingsView {
    private keys: { [key: string]: any };
    private idCounter: number = 0;
    private settings: Settings;
    private settingsView: HTMLElement;
    constructor() {
        this.settings = IntoCpsApp.IntoCpsApp.getInstance().getSettings();
        this.settingsView = document.getElementById("settings-div");
        Object.keys(SettingKeys).forEach(k => {
            if (k != "DEFAULT_VALUES" && k != "VALUE_DESCRIPTION" && k != "VALUE_DISPLAYNAME") {
                this.addSetting((<any>SettingKeys)[k]);
            }
        });
    }

    private getNextId(id: string) {
        return id + this.idCounter++;
    }

    private installHelpPopup(html: HTMLElement, settingKey: string) {
        (<HTMLButtonElement>html.querySelector("#helpBtn")).onclick = (e) =>
            w2popup.open({
                title: 'Help for ' + settingKey,
                body: SettingKeys.VALUE_DESCRIPTION[settingKey] + "<br><br>Default Value is: " + SettingKeys.DEFAULT_VALUES[settingKey],
                buttons: '',
                showClose: true,
            });
    }

    private addSetting(settingName: string) {
        let callback = (value: any) => {
            this.settings.setValue(settingName, value);
            return true;
        }
        //Get type of value
        let value = this.settings.getValue(settingName);
        let self = this;
        let settingDisplayName = SettingKeys.VALUE_DISPLAYNAME[settingName];
        if (settingDisplayName  == undefined)
            settingDisplayName = settingName;

        if (typeof (value) === "boolean") {
            $("<div>").load("checkbox-setting.html #checkbox-setting-form", function (event: JQueryEventObject) {
                let html = <HTMLElement>(<HTMLDivElement>this).firstChild;
                self.installHelpPopup(html, settingName);
                let label = html.querySelector("label");
                label.textContent = settingDisplayName;
                let chkBox = <HTMLInputElement>html.querySelector("#chkBox");
                Component.changeId(chkBox, self.getNextId("settings-chkBox"));
                chkBox.checked = value;
                chkBox.onclick = (event: MouseEvent) => {
                    callback(chkBox.checked);
                }
                self.settingsView.appendChild(html);
            });
        }
        else {
            $("<div>").load("text-setting.html #settings-form", function (event: JQueryEventObject) {
                let html = <HTMLElement>(<HTMLDivElement>this).firstChild;
                self.installHelpPopup(html, settingName);
                let label = html.querySelector("label");
                label.textContent = settingDisplayName;
                let ids = new TextInputIds();
                ids.textId = Component.changeId(<HTMLElement>html.querySelector("#text"), self.getNextId("settings-text"));
                ids.cancelButton = Component.changeId(<HTMLElement>html.querySelector("#cancelButton"), self.getNextId("settings-cancelButton"));
                ids.editOkButton = Component.changeId(<HTMLElement>html.querySelector("#editOkButton"), self.getNextId("settings-editOkButton"));

                let textInput = new TextInputNonLoad(html, value, callback.bind(self), ids);
                self.settingsView.appendChild(html);
            });
        }
    }

    public save() {
        this.settings.save();
        let remote = require("electron").remote;
        let dialog = remote.dialog;
        dialog.showMessageBox({ type: 'warning', buttons: ["ok", "cancel"], message: "Application restart required for all settings to take effect." }, function (button: any) {
            if (button == 0) {
                remote.app.relaunch();
                remote.app.exit();
            } else {
                window.top.close();
            }
        });

        return false;
    }
}

let view = new SettingsView();
