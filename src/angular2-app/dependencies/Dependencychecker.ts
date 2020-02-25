import * as child_process from "child_process";
const { dialog } = require("electron");

// check if java is running and which version no working
// inspiration from https://stackoverflow.com/questions/19734477/verify-if-java-is-installed-from-node-js
export function dependencyCheckJava() {
  var spawn = child_process.spawn("java", ["-version"]);
  spawn.on("error", err => {
    console.error(err);
    return false;
  });
  spawn.on("close", (code, signal) => {
    if (code != 0) {
      const { dialog } = require("electron");
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message:
            "Java wasn´t detected on your system \n" +
            "JRE is needed to run the COE"
        },
        function(button: any) {}
      );
    }
    console.log("the java dependency check subprocess has been closed");
  });
}

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
    } else if (pythonversion < 2.6 || pythonversion >= 3.0) {
      console.log(pythonversion);

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
    }
  });
  spawn.on("close", (code, signal) => {
    // the shell returns != 0 if it fails to run python.
    if (code != 0) {
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