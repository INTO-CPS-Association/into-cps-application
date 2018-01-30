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

import { IntoCpsAppEvents } from "./IntoCpsAppEvents";
import { SettingKeys } from "./settings/SettingKeys";
import { IntoCpsApp } from "./IntoCpsApp";
import { CreateTDGProjectController } from "./rttester/CreateTDGProject";
import { CreateMCProjectController } from "./rttester/CreateMCProject";
import { RunTestController } from "./rttester/RunTest";
import { LTLEditorController } from "./rttester/LTLEditor";
import { CTAbstractionsView } from "./rttester/CTAbstractionsView";
import { MCResultView } from "./rttester/MCResultView";
import * as RTesterModalCommandWindow from "./rttester/GenericModalCommand";
import * as AddLTLQueryDialog from "./rttester/AddLTLQueryDialog";
import { BrowserController } from "./proj/projbrowserview";
import { IntoCpsAppMenuHandler } from "./IntoCpsAppMenuHandler";
import { ViewController, IViewController } from "./iViewController";
import * as CustomFs from "./custom-fs";
import { IProject } from "./proj/IProject";
import * as SystemUtil from "./SystemUtil";
import { bootstrap } from '@angular/platform-browser-dynamic';
import { AppComponent } from './angular2-app/app.component';
import * as fs from 'fs';
import * as Path from 'path';
import { DseConfiguration } from "./intocps-configurations/dse-configuration"
import * as ShowdownHelper  from "./showdownHelper";
import {Overture} from "./overture";
import {TraceMessager} from "./traceability/trace-messenger"
import { StatusBarHandler, PreviewHandler } from "./bottom"
import {FmuImploder} from "./intocps-configurations/fmuImploder"
interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare var window: MyWindow;
declare var w2prompt: any;
declare var w2alert: any;

import * as Menus from "./menus";
import { provideForms, disableDeprecatedForms } from "@angular/forms";
import { CoeViewController } from "./angular2-app/coe/CoeViewController";
import { MmViewController } from "./angular2-app/mm/MmViewController";
import { TrViewController } from "./angular2-app/tr/TrViewController";
import { DseViewController } from "./angular2-app/dse/DseViewController";
import { enableProdMode } from '@angular/core';

import { CoeServerStatusUiController,CoeLogUiController } from "./CoeServerStatusUiController"

class InitializationController {
    // constants
    mainViewId: string = "mainView";
    layout: W2UI.W2Layout;
    title: HTMLTitleElement;
    mainView: HTMLDivElement;
    previewHandler: PreviewHandler;

    constructor() {
        $(document).ready(() => this.initialize());
    }
    private initialize() {
        this.setTitle();
        this.configureLayout();
        this.loadViews();
        this.previewHandler = new PreviewHandler((name: string, panelName: string, visible: boolean) => {
            if (visible) {
                this.layout.show(name)
            } else {
                this.layout.hide(name)
            }
        });
    }
    private configureLayout() {
        let layout: HTMLDivElement = <HTMLDivElement>document.querySelector("#layout");
        let pstyle = "border: 1px solid #dfdfdf; padding: 5px; background-color: #FFFFFF";
        this.layout = $(layout).w2layout({
            name: "layout",
            padding: 4,
            panels: [
                { type: "left", size: 200, resizable: true, style: pstyle },
                { type: "main", style: pstyle },
                { type: 'preview', size: '50%', resizable: true, style: pstyle, content: 'preview' },
                { type: 'bottom', size: 50, resizable: false, style: pstyle, content: 'bottom' }
            ]
        });
    }
    private setTitle() {
        // Set the title to the project name
        this.title = <HTMLTitleElement>document.querySelector("title");
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let p = app.getActiveProject();
        if (p != null) {
            this.title.innerText = "Project: " + p.getName() + " - " + p.getRootFilePath();
        }
        let ipc: Electron.IpcRenderer = require("electron").ipcRenderer;
        ipc.on(IntoCpsAppEvents.PROJECT_CHANGED, (event, arg) => {
            let p = app.getActiveProject();
            this.title.innerText = "Project: " + p.getName() + " - " + p.getRootFilePath();
        });
    }

    private loadViews() {
        this.layout.load("main", "main.html", "", () => {
            this.mainView = (<HTMLDivElement>document.getElementById(this.mainViewId));
            var appVer = (<HTMLSpanElement>document.getElementById('appVersion'));
            appVer.innerText = IntoCpsApp.getInstance().app.getVersion();

            let divReadme = (<HTMLDivElement>document.getElementById("mainReadmeView"));

            let readmePath1 = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "Readme.md");
            let readmePath2 = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "readme.md");
            let readmePath3 = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "README.MD");
            let readmePath4 = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "README.md");

            let theHtml1 = ShowdownHelper.getHtml(readmePath1);
            let theHtml2 = ShowdownHelper.getHtml(readmePath2);
            let theHtml3 = ShowdownHelper.getHtml(readmePath3);
            let theHtml4 = ShowdownHelper.getHtml(readmePath4);

            if (theHtml1 != null) {
                divReadme.innerHTML = theHtml1;
            }
            else if (theHtml2 != null) {
                divReadme.innerHTML = theHtml2;
            }
            else if (theHtml3 != null) {
                divReadme.innerHTML = theHtml3;
            }
            else if (theHtml4 != null) {
                divReadme.innerHTML = theHtml4;
            }

            let devMode = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.DEVELOPMENT_MODE);
            if (!devMode) {
                enableProdMode();
            }

            // Start Angular 2 application
            bootstrap(AppComponent, [disableDeprecatedForms(), provideForms()]);
        });
        this.layout.load("left", "proj/projbrowserview.html", "", () => {
            browserController.initialize();
        });
        this.layout.load("bottom", "bottom.html", "", () => {
            StatusBarHandler.initializeStatusbar(this.previewHandler);
        });
        this.layout.load("preview", "preview.html", "", () => {
            if (coeViewController == null) {
                coeViewController = new CoeServerStatusUiController(<HTMLDivElement>document.getElementById("coe-console-output"));
                coeViewController.bind();
            }
            if(coeLogViewController==null)
                {
                    coeLogViewController = new CoeLogUiController(<HTMLDivElement>document.getElementById("coe-log-output"))
                    coeLogViewController.bind();
                }
        });
        this.layout.hide("preview");
    }
}

// Initialise controllers
let menuHandler: IntoCpsAppMenuHandler = new IntoCpsAppMenuHandler();
let browserController: BrowserController = new BrowserController(menuHandler);
let init = new InitializationController();
let controller: IViewController;
let coeViewController: CoeServerStatusUiController = null;
let coeLogViewController: CoeLogUiController=null;

function closeView(): boolean {
    if (controller && controller.deInitialize) {
        let canClose = controller.deInitialize();

        if (canClose)
            controller = null;

        return canClose;
    }

    return true;
}

function openView(htmlPath: string, callback?: (mainView: HTMLDivElement) => void | IViewController) {
    if (!closeView()) return;

    function onLoad() {
        if (!callback) return;

        let newController = callback(init.mainView);

        if (newController) {
            controller = <IViewController>newController;
            if (controller.initialize) {
                controller.initialize();
            }
        }
    }

    if (htmlPath) {
        $(init.mainView).load(htmlPath, () => onLoad());
    } else {
        $(init.mainView).empty();
        onLoad();
    }
}

menuHandler.openView = openView;

menuHandler.openCoeView = (path: string) => {
    openView(null, view => new CoeViewController(view, path));
};

menuHandler.openHTMLInMainView = (path: string, title: string) => {
    openView(null, (div: HTMLDivElement) => {
        IntoCpsApp.setTopName(title);
        let f: HTMLIFrameElement = document.createElement("iframe");
        f.src = path;
        f.style.width = "100%";
        f.style.height = "100%";
        div.appendChild(f);
    });
};

menuHandler.openMultiModel = (path: string) => {
    openView(null, view => new MmViewController(view, path));
};

menuHandler.openTraceability = () => {
    openView(null, view => new TrViewController(view));
};

menuHandler.openDseView = (path: string) => {
    openView(null, view => new DseViewController(view, path));
};

menuHandler.runRTTesterCommand = (commandSpec: any) => {
    RTesterModalCommandWindow.runCommand(commandSpec);
};

menuHandler.createTDGProject = (path: string) => {
    openView("rttester/CreateTDGProject.html", view => new CreateTDGProjectController(view, menuHandler, path));
};

menuHandler.createMCProject = (path: string) => {
    openView("rttester/CreateMCProject.html", view => new CreateMCProjectController(view, menuHandler, path));
};

menuHandler.runTest = (path: string) => {
    openView("rttester/RunTest.html", view => new RunTestController(view, menuHandler, path));
};

menuHandler.openLTLQuery = (folder: string) => {
    openView("rttester/LTLEditor.html", view => new LTLEditorController(view, menuHandler, folder));
};

menuHandler.openCTAbstractions = (fileName: string) => {
    openView("rttester/CTAbstractionsView.html", view => new CTAbstractionsView(view, fileName));
};

menuHandler.showAddLTLQuery = (folder: string) => {
    $("#modalDialog").load("rttester/AddLTLQueryDialog.html", (event: JQueryEventObject) => {
        AddLTLQueryDialog.display(folder);
        (<any>$("#modalDialog")).modal({ keyboard: false, backdrop: false });
    });
};

menuHandler.openMCResult = (fileName: string) => {
    openView("rttester/MCResultView.html", view => new MCResultView(view, fileName));
};

menuHandler.openSysMlExport = () => {
    openView("sysmlexport/sysmlexport.html");
    IntoCpsApp.setTopName("SysML Export");
};

menuHandler.openSysMlDSEExport = () => {
    openView("sysmlexport/sysmldseexport.html");
    IntoCpsApp.setTopName("SysML DSE Export");
};

menuHandler.openFmu = () => {
    openView("fmus/fmus.html");
    IntoCpsApp.setTopName("FMUs");
};

//menuHandler.createDse = (path) => {
//    // create empty DSE file and load it.
//    openView("dse/dse.html", () => {
//        menuHandler.openDseView("");
//    });
//};
//

menuHandler.createMultiModel = (path, msgTitle = 'New Multi-Model') => {
    let appInstance = IntoCpsApp.getInstance();
    let project = appInstance.getActiveProject();

    if (project) {
        let name = Path.basename(path, ".sysml.json");
        let ivname = project.freshMultiModelName(`mm-${name}`);
        let mmPath = null;
        w2prompt({
            label: 'Name',
            value: ivname,
            attrs: 'style="width: 500px"',
            title: msgTitle,
            ok_text: 'Ok',
            cancel_text: 'Cancel',
            width: 500,
            height: 200,
            callBack: function (value: String) {

                let content = fs.readFileSync(path, "UTF-8");
                try {
                    if (!value) { return; }
                    mmPath = <string>project.createMultiModel(value, content);
                    menuHandler.openMultiModel(mmPath);
                } catch (error) {
                    menuHandler.createMultiModel(path, 'Multi-Model "' + value + '" already exists! Choose a different name.');
                    return;
                }
                //Create the trace 
                if (mmPath) {
                    let message = TraceMessager.submitSysMLToMultiModelMessage(mmPath, path);
                    //console.log("RootMessage: " + JSON.stringify(message));    
                }
            }
        });
    }
};


menuHandler.createSysMLDSEConfig = (path) => {
    let project = IntoCpsApp.getInstance().getActiveProject();

    if (project) {
        let name = Path.basename(path, ".sysml-dse.json");
        let content = fs.readFileSync(path, "UTF-8");
        let dsePath = <string>project.createSysMLDSEConfig(`dse-${name}-${Math.floor(Math.random() * 100)}`, content);
        menuHandler.openDseView(dsePath);
    }
};

menuHandler.createDsePlain = () => {
    let project = IntoCpsApp.getInstance().getActiveProject();
    if (project) {
        let name = "new";
        let dseConfig = new DseConfiguration()
        let dseObject = dseConfig.toObject();
        let dseJson = JSON.stringify(dseObject);
        let dsePath = <string>project.createDse("dse-" + name + "-(" + Math.floor(Math.random() * 100) + ")", dseJson);
        menuHandler.openDseView(dsePath);
    }
}

menuHandler.createMultiModelPlain = (titleMsg: string = 'New Multi-Model') => {
    let project = IntoCpsApp.getInstance().getActiveProject();

    if (project) {
        let ivname = project.freshMultiModelName(`mm-new`);
        w2prompt({
            label: 'Name',
            value: ivname,
            attrs: 'style="width: 500px"',
            title: titleMsg,
            ok_text: 'Ok',
            cancel_text: 'Cancel',
            width: 500,
            height: 200,
            callBack: function (value: String) {
                try {
                    if (!value) { return; }
                    let mmPath = <string>project.createMultiModel(value, "{}");
                    menuHandler.openMultiModel(mmPath);
                } catch (error) {
                    menuHandler.createMultiModelPlain('Multi-Model "' + value + '" already exists! Choose a different name.');
                }
            }
        });

    }
};

menuHandler.implodeConfig = (path) => {
    FmuImploder.createImplodeFMU(path);
}
menuHandler.createCoSimConfiguration = (path) => {

    let appInstance = IntoCpsApp.getInstance();
    let project = appInstance.getActiveProject();

    if (project) {
        //let name    = Path.basename(path, ".sysml.json");
        let ivname = project.freshFilename(Path.dirname(path), `co-sim`);

        let msgTitle = 'New Co-Simulation Configuration';
        w2prompt({
            label: 'Name',
            value: ivname,
            attrs: 'style="width: 500px"',
            title: msgTitle,
            ok_text: 'Ok',
            cancel_text: 'Cancel',
            width: 500,
            height: 200,
            callBack: function (value: String) {
                try {
                    if (!value) { return; }

                    let coePath = project.createCoSimConfig(path, value, null).toString();
                    menuHandler.openCoeView(coePath);

                    if (coePath) {
                        let message = TraceMessager.submitCoeConfigMessage(path, coePath);
                    }
                } catch (error) {
                    return;
                }
            }
        });
    }
};

menuHandler.deletePath = (path) => {
    let name = Path.basename(path);
    if (name.indexOf('R_') >= 0) {
        console.info("Deleting " + path);
        CustomFs.getCustomFs().removeRecursive(path, function (err: any, v: any) {
            if (err != null) {
                console.error(err);
            }
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
        });

    } else if (name.endsWith("coe.json") || name.endsWith("mm.json") || name.endsWith(".dse.json")) {
        let dir = Path.dirname(path);
        console.info("Deleting " + dir);
        CustomFs.getCustomFs().removeRecursive(dir, function (err: any, v: any) {
            if (err != null) {
                console.error(err);
            }
            IntoCpsApp.getInstance().emit(IntoCpsAppEvents.PROJECT_CHANGED);
        });
    }
};

menuHandler.openWithSystemEditor = (path) => {
    SystemUtil.openPath(path);
};

menuHandler.rename = (path: string) => {
    var DialogHandler = require("./DialogHandler").default;
    let renameHandler = new DialogHandler("proj/rename.html", 300, 200, null, null, null);

    if (path.endsWith("coe.json") || path.endsWith("mm.json")) {
        renameHandler.openWindow(Path.dirname(path));
    }
};
menuHandler.showTraceView = () => {
    var DialogHandler = require("./DialogHandler").default;
    let renameHandler = new DialogHandler("traceability/traceHints.html", 600, 800, null, null, null);

    renameHandler.openWindow();
    menuHandler.openHTMLInMainView("http://localhost:7474/browser/", "Traceability Graph View");
};

menuHandler.exportOvertureFmu = Overture.exportOvertureFmu;


Menus.configureIntoCpsMenu();
