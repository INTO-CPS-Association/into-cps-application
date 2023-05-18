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

import IntoCpsApp from  "./IntoCpsApp";
import {SettingKeys} from "./settings/SettingKeys"
const {remote, BrowserWindow} = require("electron");
export default class DialogHandler {

    doAction: (arg: any) => void;
    htmlPath: string;
    ipcDoActionEventName: string;
    ipcOpenEventName: string;
    windowWidth: number;
    windowHeight: number;

    externalUrl: boolean = false;

    win: Electron.BrowserWindow = null;

    constructor(htmlPath: string, windowWidth: number,
        windowHeight: number/* , ipcOpenEventName: string, ipcDoActionEventName: string, doAction: (arg: any) => void */) {
        this.htmlPath = htmlPath;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
       /*  this.ipcDoActionEventName = ipcDoActionEventName;
        this.doAction = doAction;
        this.ipcOpenEventName = ipcOpenEventName;
    }

    public install() {

        if (this.ipcOpenEventName != null) {

            IntoCpsApp.getInstance().on(this.ipcOpenEventName, (path: any) => {
                console.log(path);  // prints "ping"
                //event.sender.send('asynchronous-reply', 'pong');
                this.openWindow();
            });
        }

        if (this.ipcDoActionEventName != null) {
            IntoCpsApp.getInstance().on(this.ipcDoActionEventName, (arg: any) => {
                this.doAction(arg);
                this.win.close();
            });
        } */

    }

    public openWindow(data:string = '', showWindow:boolean = true) : Electron.BrowserWindow {
        let self = this;
       this.win = (BrowserWindow 
        ? new BrowserWindow({ width: this.windowWidth, height: this.windowHeight, show: showWindow, webPreferences: {nodeIntegration: true, enableRemoteModule : true, contextIsolation: false }}) 
        : new remote.BrowserWindow({ width: this.windowWidth, height: this.windowHeight, show: showWindow, webPreferences: {nodeIntegration: true, enableRemoteModule : true, contextIsolation: false }}));
        if(!IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.DEVELOPMENT_MODE) && this.win.setMenu)
            this.win.setMenu(null);

        // Open the DevTools.
        if (IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.DEVELOPMENT_MODE)){
            this.win.webContents.openDevTools();
        }
       /*  window.onbeforeunload = (ev: BeforeUnloadEvent) => {if(this.win) this.win.removeAllListeners();} */

        this.win.on('closed', function () {
            self.win.removeAllListeners();
            this.win = null;
        });

        if (this.externalUrl) {
            this.win.loadURL(this.htmlPath);
        } else {
            this.win.loadURL(`file://${__dirname}/${this.htmlPath}?data=${data}`);
        }
        return this.win;
    }

}
export {DialogHandler}

