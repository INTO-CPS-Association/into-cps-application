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

import fs = require("fs");
import path = require("path");
import {ISettingsValues} from "./ISettingsValues";
import {SettingKeys} from "./SettingKeys";

export default class Settings implements ISettingsValues {
  app: Electron.App;
  userDataPath: string;
  intoCpsAppFolder: string;
  settingsFile: string;
  counter: number;
  intoCpsDataObject: any = { "into-cps-settings-version": "0.0.1" };

  constructor(app: Electron.App, intoCpsAppFolder: string) {
    this.app = app;
    this.intoCpsAppFolder = intoCpsAppFolder;
    this.settingsFile = path.normalize(this.intoCpsAppFolder + "/settings.json");
    this.counter = 0;
  }

  public save() {
    this.storeSettings();
  }

  storeSettings() {
    fs.open(this.settingsFile, "w", (err, fd) => {
      if (err) {
        "The error: " + err + " happened when attempting to open the file: " + this.settingsFile + " for writing.";
      }
      else {
        fs.write(fd, JSON.stringify(this.intoCpsDataObject, null, 4), (err) => {
          if (err) {
            console.log("Failed to write settings in : " + this.settingsFile + ".");
          }
          else {
            console.log("Stored settings in : " + this.settingsFile + ".");
          }
          fs.close(fd, (err) => {
            if (err) {
              console.log("Failed to close writing to the file: " + this.settingsFile + ".");
              throw err;
            }
          });
        });
      }
    });
  }

  deleteSettings() {
    try {
      if(fs.existsSync(this.settingsFile)) {
      fs.unlink(this.settingsFile, (err) => {
        if(err) throw err;
        console.log(this.settingsFile + ' was deleted');
      });
    }
    } catch (e) {
      console.log(e);
    }
  }

  load() {
    try {

      let initial = false;
      try {
        if (!fs.statSync(this.settingsFile).isFile()) {
          initial = true;
        }
      } catch (e) {
        initial = true;
      }

      if (initial) { // no settings file created yet, just use DOM
        this.intoCpsDataObject = {};
        return;
      }

      // Reads settings.json from user's computer
      this.intoCpsDataObject = JSON.parse(fs.readFileSync(this.settingsFile, "UTF-8"));
      
      // To remove after migration into-cps project to into-cps-association is complete
      this.migrateToAssociation();

    } catch (e) {
      console.log("Failed to read settings from file: " + this.settingsFile + ".");
      if(e instanceof SyntaxError) {
        this.intoCpsDataObject = {};
        this.deleteSettings();
      } else {
        console.log('error occured: ' + e);
        throw e;
      }
    }
    
    console.info(this.intoCpsDataObject);
    console.log("Finished loading settings.");
    /* fs.readFile(this.settingsFile, (err, data) => {
       if (err) {
         console.log("Failed to read settings from file: " + this.settingsFile + ".");
         throw err;
       }
       else {        
         this.intoCpsDataObject = JSON.parse(data.toString());
         console.info(this.intoCpsDataObject);
         console.log("Finished loading settings.");
       }
     });*/
  }

  // To remove after migration into-cps project to into-cps-association is complete
  private migrateToAssociation() {

    let changed : boolean = false;

    if (this.intoCpsDataObject[SettingKeys.UPDATE_SITE] == 'https://raw.githubusercontent.com/into-cps/into-cps.github.io/master/download/') {
      this.intoCpsDataObject[SettingKeys.UPDATE_SITE] = SettingKeys.DEFAULT_VALUES[SettingKeys.UPDATE_SITE];
      changed = true;
    }
    if (this.intoCpsDataObject[SettingKeys.DEV_UPDATE_SITE] == 'https://raw.githubusercontent.com/into-cps/into-cps.github.io/development/download/') {
      this.intoCpsDataObject[SettingKeys.DEV_UPDATE_SITE] = SettingKeys.DEFAULT_VALUES[SettingKeys.DEV_UPDATE_SITE];
      changed = true;
    }
    if (this.intoCpsDataObject[SettingKeys.EXAMPLE_REPO] == 'https://raw.githubusercontent.com/into-cps/into-cps.github.io/master/examples/examples.json') {
      this.intoCpsDataObject[SettingKeys.EXAMPLE_REPO] = SettingKeys.DEFAULT_VALUES[SettingKeys.EXAMPLE_REPO];
      changed = true;
    }
    if (this.intoCpsDataObject[SettingKeys.DEV_EXAMPLE_REPO] == 'https://raw.githubusercontent.com/into-cps/into-cps.github.io/examples-dev/examples/examples.json') {
      this.intoCpsDataObject[SettingKeys.DEV_EXAMPLE_REPO] = SettingKeys.DEFAULT_VALUES[SettingKeys.DEV_EXAMPLE_REPO];
      changed = true;
    }

    if (changed) this.save();
  
  }

  setValue(key: string, value: any) {
    this.intoCpsDataObject[key] = value;
  }


  getValue(key: string): any {
    return this.intoCpsDataObject[key];
  }


  setSetting(key: string, value: any) {
    this.setValue(key, value);
  }

  getSetting(key: string): any {
    return this.getValue(key);
  }

}

export {Settings}
