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
import * as child_process from "child_process";

  // check if java is running and which version no working
  export function dependencyCheckJava() {
    var spawn = child_process.spawn("java", ["-version"]);
    spawn.on("error", err => {
      console.error(err);
      return false;
    });
    spawn.on("close", (code, signal) => {
      if (code != 0) {
        let remote = require('electron').remote;
        let dialog = remote.dialog;
        dialog.showMessageBox(
          {title: "error", buttons: ["OK"], message: "Java wasn´t detected on your system \n" +
          "JRE is needed to run the COE"}
        );
      }
      console.log("the java dependency check subprocess has been closed");
    });
  }
/* }
 */

// check if python is running and which version no working

export function dependencyCheckPythonVersion() {
  var spawn = child_process.spawn("python", ["--version"]);
  spawn.on("error", err => {
    console.error(err);
    return false;
  });
  spawn.stderr.on("data", function(data) {
    data = data.toString("utf8").split("\n")[0];
    // the pythonVersion is false if the output from the spawn do not follow the stardard of: "Python *.*.*"
    var pythonVersion = data.split(" ")[1] ? data.split(" ")[1] : false;
    if (pythonVersion != false) {
      // this converts a string of "*.*.*"" into a number *.*
      var pythonversion = parseFloat(pythonVersion);
      
    } else if (pythonVersion === false) {
      console.log(data);
      // should find a better way than this to display dialogs
      let remote = require('electron');
      let dialog = remote.dialog;
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message:
            "INTO-CPS found Python on your system. \n" +
            "But was unable to assess your version of Python. \n" +
            "Your python version needs to be 2.7 or newer."
        },
        function(button: any) {}
      );

    }
   
  });
  spawn.stdout.on('data', function(data) {
    data = data.toString("utf8").split("\n")[0];
    var pythonVersion = data.split(" ")[1] ? data.split(" ")[1] : false;
    var pythonversion = parseFloat(pythonVersion);
    if (pythonversion < 2.6 /* || pythonversion >= 3.0 */) {

      console.log(pythonversion);
      let remote = require('electron').remote;
      let dialog = remote.dialog;
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message:
            "INTO-CPS has assest your python version to be older than 2.7.  \n" +
            "Your python version needs to be 2.7 or newer"
        },
        function(button: any) {}
      );
    } else if (pythonversion > 3.0) {
      console.log(pythonversion);
      let remote = require('electron').remote;
      let dialog = remote.dialog;
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message:
            "INTO-CPS has assest your python version to be newer than 2.9.  \n" +
            "Your python version needs to be 2.7 or newer, but can´t be 3.0 or newer"
        },
        function(button: any) {}
      );
    }
  })
  spawn.on("close", (code, signal) => {
    // the shell returns != 0 if it fails to run python.
    if (code != 0) {
      let remote = require('electron').remote;
      let dialog = remote.dialog;
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message: "Python wasn't found on your system"
        },
        function(button: any) {}
      );
    }
    
    console.log("the python dependency check subprocess has been closed");
  });
}
