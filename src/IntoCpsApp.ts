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

import * as Path from 'path';
import * as fs from 'fs';


import { ISettingsValues } from "./settings/ISettingsValues";
import { Settings } from "./settings/settings";
import { IProject } from "./proj/IProject";
import { Project } from "./proj/Project";
import { IntoCpsAppEvents } from "./IntoCpsAppEvents";
import { SettingKeys } from "./settings//SettingKeys";
import { Utilities } from "./utilities";
import { CoeProcess } from "./coe-server-status/CoeProcess";

const {remote} = require("electron");

// constants
let topBarNameId: string = "activeTabTitle";

 const globalAny:any = global;
    export default class IntoCpsApp { 

    app: Electron.App;
    platform: String
    window: Electron.BrowserWindow;
    coeProcess: CoeProcess = null;

    settings: Settings;

    activeProject: IProject = null;
    isquitting = false;

    constructor(app: Electron.App, processPlatform: String) {
        this.app = app;
        this.platform = processPlatform;

        const intoCpsAppFolder = this.createAppFolderRoot(app);
        this.createDirectoryStructure(intoCpsAppFolder);
        // Set calculated default values
        let defaultValues = SettingKeys.DEFAULT_VALUES;
        let projRoot = Utilities.getSystemPlatform() == "windows" ? this.app.getPath('documents') : this.app.getPath('home');
        let defaultProjectFolderPath = Path.join(projRoot, "into-cps-projects");
        defaultValues[SettingKeys.INSTALL_TMP_DIR] = Path.join(defaultProjectFolderPath, "install_downloads");
        defaultValues[SettingKeys.INSTALL_DIR] = Path.join(defaultProjectFolderPath, "install");
        defaultValues[SettingKeys.DEFAULT_PROJECTS_FOLDER_PATH] = defaultProjectFolderPath;

        this.settings = new Settings(app, intoCpsAppFolder);


        this.settings.load();
        // fill-in default values for yet unset values
        for (var key in defaultValues) {
            if (this.settings.getSetting(key) == null) {
                let value: any = SettingKeys.DEFAULT_VALUES[key];
                this.settings.setSetting(key, value);
            }
        }
        this.settings.save();

        //Check for development mode and adjust settings to reflect this
        if (this.settings.getValue(SettingKeys.DEVELOPMENT_MODE)) {
            this.settings.setValue(SettingKeys.UPDATE_SITE, this.settings.getValue(SettingKeys.DEV_UPDATE_SITE));
            this.settings.setValue(SettingKeys.EXAMPLE_REPO, this.settings.getValue(SettingKeys.DEV_EXAMPLE_REPO));
        } else {
            this.settings.setValue(SettingKeys.UPDATE_SITE, defaultValues[SettingKeys.UPDATE_SITE]);
            this.settings.setValue(SettingKeys.EXAMPLE_REPO, defaultValues[SettingKeys.EXAMPLE_REPO]);
        }
    }

    public loadPreviousActiveProject(){
        let activeProjectPath = this.settings.getSetting(SettingKeys.ACTIVE_PROJECT);
        if (activeProjectPath) {
            try {
                if (fs.accessSync(activeProjectPath, fs.constants.R_OK) !== null) {

                    this.activeProject = this.loadProject(activeProjectPath);
                } else {
                    console.error("Could not read the active project path from settings: " + activeProjectPath);
                }
            } catch (e) {
                console.warn(e);
                console.warn("Unable to set active project from settings: " + activeProjectPath);
            }
        }
        this.coeProcess = new CoeProcess(this.settings);

    }

    public unloadProject() {
        this.fireEvent(IntoCpsAppEvents.PROJECT_CHANGED);


        this.settings.setSetting(SettingKeys.ACTIVE_PROJECT, null);
        this.settings.save();
    }

    public getCoeProcess(): CoeProcess {
        return this.coeProcess;
    }

    public setWindow(win: Electron.BrowserWindow) {
        this.window = win;
        
    }




    private createAppFolderRoot(app: Electron.App): string {
        // Create intoCpsApp folder
        const userPath = function () {
            if (app.getPath("exe").indexOf("electron-prebuilt") > -1) {

                console.log("Dev-mode: Using " + __dirname + " as user data path.");
                return __dirname;
            }
            else {
                let path = app.getPath("userData");
                console.log(`Npm start user data path: ${path}`);
                return path;
            }
        } ();

        return Path.normalize(userPath + "/intoCpsApp");
    }

    private createDirectoryStructure(path: string) {
        try {
            fs.mkdirSync(path);
        } catch (e) {
            // the path probably already existed
        }
    }

    public getSettings(): Settings {
        return this.settings;
    }

    public getActiveProject(): IProject {
        return this.activeProject;
    }

    public setActiveProject(project: IProject) {

        if (project == null)
            return;

        this.activeProject = project;

        // Fire an event to inform all controlls on main window that the project has changed
        this.fireEvent(IntoCpsAppEvents.PROJECT_CHANGED);


        this.settings.setSetting(SettingKeys.ACTIVE_PROJECT, project.getProjectConfigFilePath());
        this.settings.save();
    }


    // Fires an ipc event using the window webContent if defined
    private fireEvent(event: string) {
        if (this.window != undefined) {
            // Fire an event to inform all controlls on main window that the project has changed
            this.window.webContents.send(IntoCpsAppEvents.PROJECT_CHANGED);
            this.window.reload();
            console.info("fire event: " + event);
        }
  

    }


    public createProject(name: string, path: string) {
        let project = new Project(name, path, Path.normalize(path + "/.project.json"));
        project.save();
        this.setActiveProject(project);
     }

     // need to fire this to load the projects for the test
    loadProject(path: string): IProject {
        console.info("Loading project from: " + path); 
        let config = Path.normalize(path);
        let content = fs.readFileSync(config, "utf8");
        // TODO load configuration containers and config files
        let project = SerializationHelper.toInstance(new Project("", "", ""), content.toString());
        project.configPath = path;
        project.rootPath = Path.dirname(path);
        project.save() // create all the project folders, in case they don't exist.
         return project;
    }

    //get the global instance
    public static getInstance(): IntoCpsApp {
        let intoApp:IntoCpsApp = null;
        if (remote){
            intoApp = remote.getGlobal("intoCpsApp");
        }else{
            intoApp = global.intoCpsApp;
        }
        return intoApp;
    }

    // change topbar title
    public static setTopName(s: string) {
        var mainName = (<HTMLSpanElement>document.getElementById(topBarNameId));
        mainName.innerText = s;
    };


}

// http://stackoverflow.com/questions/29758765/json-to-typescript-class-instance
class SerializationHelper {
    static toInstance<T>(obj: T, json: string): T {
        let jsonObj = JSON.parse(json);

        if (typeof (<any>obj)["fromJSON"] === "function") {
            (<any>obj)["fromJSON"](jsonObj);
        }
        else {
            for (let propName in jsonObj) {
                (<any>obj)[propName] = jsonObj[propName];
            }
        }

        return obj;
    }
}


export { IntoCpsApp };
