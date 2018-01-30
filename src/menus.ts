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

const electron = require('electron');
const Menu = electron.remote.Menu;
const fs = require('fs');
const path = require('path');
var settings = require("./settings/settings").default;
var SettingKeys = require("./settings/SettingKeys");
var IntoCpsApp = require("./IntoCpsApp").default;
import * as SystemUtil from "./SystemUtil";
import {openProjectViaDirectoryDialog} from "./proj/Project"

var DialogHandler = require("./DialogHandler").default;
var IntoCpsAppEvents = require("./IntoCpsAppEvents");
var ProjectFetcher = require("./proj/ProjectFetcher");

const intoCpsApp = IntoCpsApp.getInstance();


let createProjectHandler = new DialogHandler("proj/new-project.html", 300, 200, IntoCpsAppEvents.OPEN_CREATE_PROJECT_WINDOW, "new-project-create", (arg: any) => {
  intoCpsApp.createProject(arg.name, arg.path);
});

let openDownloadManagerHandler = new DialogHandler("downloadManager/DownloadManager.html", 500, 500, null, null, null);
export let coeServerStatusHandler = new DialogHandler("coe-server-status/CoeServerStatus.html", 500, 500, null, null, null);
let fmuBuilderHandler = new DialogHandler("http://sweng.au.dk/fmubuilder/", 500, 500, null, null, null);
fmuBuilderHandler.externalUrl = true;
let reportIssueHandler = new DialogHandler("https://github.com/into-cps/intocps-ui/issues/new", 600, 600, null, null, null);
reportIssueHandler.externalUrl = true;


let fetchProjectFromGitHandler = new DialogHandler("proj/ProjectFetcher.html", 500, 300, null, null, null);
let openExamplesFromGitHandler = new DialogHandler("examples/examples.html", 500, 400, null, null, null);
let openSettingsHandler = new DialogHandler("settings/settings.html", 500, 600, null, null, null);

createProjectHandler.install();
openDownloadManagerHandler.install();

export function openCOEServerStatusWindow(data: string = "", show:boolean=true) {
  let coe = intoCpsApp.getCoeProcess();
  if(!coe.isRunning())
    intoCpsApp.getCoeProcess().start();
}

export function configureIntoCpsMenu() {

  const {remote} = require('electron');
  const app = remote.app
  const {Menu, MenuItem} = remote;

  // Definitions needed for menu construction
  var defaultMenu = require('electron-default-menu')
  // Get template for default menu 
  var menu: any[] = defaultMenu();


  var fileMenuPos = 0;

  if (process.platform === 'darwin') {
    fileMenuPos = 1;

    menu[0].submenu.splice(1, 0, {
      type: 'separator'

    });

    menu[0].submenu.splice(2, 0, {
      label: 'Preferences...',
      accelerator: 'Cmd+,',
      click: function (item: any, focusedWindow: any) {
        openSettingsHandler.openWindow();
      }
    });

    menu[0].submenu.splice(3, 0, {
      type: 'separator'

    });
  }

  // Add custom menu 
  menu.splice(fileMenuPos, 0, {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: function (item: any, focusedWindow: any) {
          createProjectHandler.openWindow();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Open Project',
        accelerator: 'CmdOrCtrl+O',
        click: function (item: any, focusedWindow: any) {
          //openProjectHandler.openWindow();
          openProjectViaDirectoryDialog();
        }

      },
      {
        label: 'Import Project from Git',

        click: function (item: any, focusedWindow: any) {
          fetchProjectFromGitHandler.openWindow();
        }

      },
      {
        label: 'Import Example Project',

        click: function (item: any, focusedWindow: any) {
          openExamplesFromGitHandler.openWindow();
        }

      },
      {
        type: 'separator'
      },
      {
        label: 'Open Current Project in File Browser',
        click: function (item: any, focusedWindow: any) {
          let activeProject = IntoCpsApp.getInstance().getActiveProject();
          if (activeProject != null)
            SystemUtil.openPath(activeProject.rootPath);
        },
      }
    ]
  })

  // Add File->Exit on Windows
  if (process.platform === 'win32') {
    menu[fileMenuPos].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Exit',
        click: function (item: any, focusedWindow: any) {
          app.quit();
        }
      })
  }


  menu.forEach(m => {
    if (m.label == "Window") {
      if (!(process.platform === 'darwin')) {
        m.submenu.splice(m.submenu.length - 1, 0, {
          type: 'separator'

        });
        m.submenu.splice(-1, 0, {
          label: 'Show Settings',
          accelerator: 'Alt+S',
          click: function (item: any, focusedWindow: any) {
            openSettingsHandler.openWindow();
          }
        });

      }

      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Show Download Manager',
        accelerator: 'Alt+D',
        click: function (item: any, focusedWindow: any) {
          openDownloadManagerHandler.openWindow();
        }
      });

      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Show FMU Builder',
        click: function (item: any, focusedWindow: any) {
          fmuBuilderHandler.openWindow();
        }
      });
      m.submenu.splice(m.submenu.length - 1, 0, {
        type: 'separator'

      });

    } else if (m.label == "Help") {
      m.submenu.splice(m.submenu.length - 1, 0, {
        label: 'Report Issue',
        click: function (item: any, focusedWindow: any) {
          reportIssueHandler.openWindow();
        }
      });
    }

  });



  // Set top-level application menu, using modified template 
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));




}
