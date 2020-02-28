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
      let remote = require("electron").remote;
      let dialog = remote.dialog;
      dialog.showMessageBox(
        {title: "error", buttons: ["OK"], message: "Java wasn´t detected on your system \n" +
        "JRE is needed to run the COE"}
      );
    }
    console.log("the java dependency check subprocess has been closed");
  });
}
