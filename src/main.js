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

'use strict';

const electron = require('electron');
var SettingKeys = require("./settings/SettingKeys");
var IntoCpsApp = require("./IntoCpsApp").default;
var Menus = require("./menus");


// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// to ensure that the reading of files using fs is not blocked by the restart function from electron.
app.allowRendererProcessReuse = false;

let intoCpsApp = new IntoCpsApp(app, process.platform);

global.intoCpsApp = intoCpsApp;
global.test = 1;
let devMode = intoCpsApp.getSettings().getValue(SettingKeys.SettingKeys.DEVELOPMENT_MODE);
console.info("Running in development mode: " + devMode);




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {

  //First load the last active project, but not until app is ready
  intoCpsApp.loadPreviousActiveProject();
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600, webPreferences: {  nodeIntegration: true, enableRemoteModule: true}});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  if (devMode) {
    mainWindow.webContents.openDevTools();
  }

  intoCpsApp.setWindow(mainWindow);

  function recursivelyCloseBrowserWindows(bw){
    bw.getChildWindows().forEach(bw => recursivelyCloseBrowserWindows(bw));
    bw.removeAllListeners();
    bw.close();
  }


  mainWindow.on('close', function (ev) {
    console.log("mainwindow on close");
    intoCpsApp.isquitting = true;

    /* BrowserWindow.getAllWindows().forEach((bw => {
      if (bw != mainWindow) {
        bw.removeAllListeners();
        bw.close();
      }
    })); */

    BrowserWindow.getAllWindows().forEach(bw => recursivelyCloseBrowserWindows(bw));

  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  /* //We cannot fire any events indicating that the active project has been loaded since we dont know when all recievers are loaded and ready
    mainWindow.on('minimize', function () {
      //Activate project
      console.info("Setting active project on show")
      let p = global.intoCpsApp.getActiveProject();
      console.info(p);
      global.intoCpsApp.setActiveProject(p);
  
    });*/
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  Menus(intoCpsApp).configureIntoCpsMenu();
  createWindow();
});


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //the app is not build to handle this since windows are created
  //from render processes
  //if (process.platform !== 'darwin') {

  // for testing purposes this should be uncommented
  // intoCpsApp.getSettings().deleteSettings();
  app.quit();
  //}
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

if(process.env.RUNNING_IN_SPECTRON) {
  app.getActiveProject = () => { 
    return intoCpsApp.getSettings().getValue(SettingKeys.SettingKeys.ACTIVE_PROJECT)};
}




