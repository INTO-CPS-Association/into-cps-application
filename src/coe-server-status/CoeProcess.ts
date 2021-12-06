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

import { IntoCpsApp } from "../IntoCpsApp";
import { SettingKeys } from "../settings/SettingKeys";
import { ISettingsValues } from "../settings/ISettingsValues";
import * as Path from "path";
import fs = require("fs");
import * as child_process from "child_process";
import { CoeLogPrinter } from "./../coeLogPrinter";
import { UICrtlType } from "./../CoeServerStatusUiController";
import { dependencyCheckJava } from "../angular2-app/dependencies/Dependencychecker";

export class CoeProcess {
  private settings: ISettingsValues;
  private static firstStart = true;
  private process: child_process.ChildProcess = null;
  private maxReadSize = 100000;
  // java check
  private static javaprop: boolean = false;
  private coeLogPrinter: CoeLogPrinter;
  private coeConsolePrinter: CoeLogPrinter;
  private cbPrepSimCBs: Map<UICrtlType, () => void> = new Map<
    UICrtlType,
    () => void
  >();
  public constructor(settings: ISettingsValues) {
    this.settings = settings;
  }

  //get the url needed to obtain the version of the coe
  public static getCoeVersionUrl() {
    let url =
      IntoCpsApp.getInstance()
        .getSettings()
        .getSetting(SettingKeys.COE_URL) || "localhost:8082";
    return (url = `http://${url}/version`);
  }

  //stop the coe if running
  public stop() {
    if (fs.existsSync(this.getPidFilePath())) {
      this.internalKill(this.getPid(), () => {
        if (fs.existsSync(this.getPidFilePath()))
          fs.unlinkSync(this.getPidFilePath());
      });
    }

    if (this.process != null && this.process.connected) {
      this.process.kill();
    }
  }

  private internalKill(pid: string, successHandler: any) {
    var kill = require("tree-kill");

    if (pid && pid.toString().trim()) {
      console.info("Killing: '" + pid + "'");
      kill(pid, "SIGKILL", (err: any) => {
        if (err) {
          console.error(
            "Failed to close COE. " +
              "It was not possible to close the COE. Pid: " +
              pid
          );
        }
        if (!err) {
          if (successHandler) {
            successHandler();
          }
        }
      });
    }
  }

  private getWorkingDir() {
    let installDir = this.settings.getValue(SettingKeys.INSTALL_TMP_DIR);
    let childCwd = Path.join(installDir, "coe-working-dir");
    if (!fs.existsSync(childCwd)) {
      fs.mkdirSync(childCwd,{recursive: true});
    }
    return childCwd;
  }

  private getLogFilePath() {
    return Path.join(this.getWorkingDir(), "console.log");
  }

  private getLog4JFilePath() {
    return Path.join(this.getWorkingDir(), "coe.log");
  }

  private getPidFilePath() {
    return Path.join(this.getWorkingDir(), "coe.pid");
  }

  //get the pid of the running coe process
  public getPid(): string {
    if (fs.existsSync(this.getPidFilePath())) {
      //this.stop();
      var pid = fs.readFileSync(this.getPidFilePath());
      return pid + "";
    }
    return null;
  }

  //get error log line prefix used for the err stream
  public getErrorLogLinePrefix(): string {
    return String.fromCharCode(25);
  }

  //check if the coe is running, this is done based no the existence of the pid file
  public isRunning() {
    let pid = this.getPid();
    if (pid == null) {
      return false;
    }
    let isRunning = require("is-running")(pid);
    if (!isRunning) {
      fs.unlinkSync(this.getPidFilePath());
    }
    return isRunning;
  }

  //check if the streams redirection to the log is active
  public isLogRedirectActive() {
    return this.process != null;
  }

  //get the path to the coe jar which will be launched
  public getCoePath() {
    let installDir = this.settings.getValue(SettingKeys.INSTALL_TMP_DIR);
    var coePath = Path.join(installDir, "coe.jar");
    let overrideCoePath = this.settings.getValue(SettingKeys.COE_JAR_PATH);
    if (fs.existsSync(overrideCoePath)) {
      coePath = overrideCoePath;
    }
    return coePath;
  }

  private checkCoeAvaliablity() {
    return fs.existsSync(this.getCoePath());
  }

  //start or restart the COE process
  public start() {
    if (!this.checkCoeAvaliablity()) {
      const electron = require("electron");
      var dialog = electron.dialog;
      dialog.showMessageBox(
        {
          type: "error",
          buttons: ["OK"],
          message:
            "Please install the: 'Co-simulation Orchestration Engine' first."
        }
      );
      // might not be nessasery
      return;
    }

    if (CoeProcess.firstStart) {
      //fs.unlinkSync(this.getLogFilePath())
      //fs.unlinkSync(this.getPidFilePath());
      CoeProcess.firstStart = false;
    }

    if (fs.existsSync(this.getPidFilePath())) {
      //this.stop();
      var pid = this.getPid();
      if (fs.existsSync(this.getPidFilePath()))
        fs.unlinkSync(this.getPidFilePath());
      this.internalKill(pid + "", null);
    } else {
      if (fs.existsSync(this.getLogFilePath())) {
        // fs.unlinkSync(this.getLogFilePath())
      }
    }

    // Checking if java is installed.
    dependencyCheckJava();

    var spawn = child_process.spawn;

    let childCwd = this.getWorkingDir();
    let env: any = process.env;
    env["RTT_OP_KEY"] = "TMS:19999:FMI";

    var mkdirp = require("mkdirp");
    mkdirp.sync(childCwd);

    let logFile = this.getLogFilePath();

    var child = spawn("java", ["-jar", this.getCoePath()], {
      detached: true,
      shell: false,
      cwd: childCwd,
      env: env
    });
    child.unref();

    this.process = child;

    console.info("Starting COE process pid = " + child.pid);
    fs.writeFile(this.getPidFilePath(), child.pid, function(err) {
      if (err) {
        throw err;
      }
    });

    child.stdout.on("data", function(data: any) {
      //Here is where the output goes
      let dd = (data + "").split("\n");
      // console.info("stdout" + data);
      dd.forEach(line => {
        if (line.trim().length != 0) {
          // console.info(line);
          fs.appendFile(logFile, line + "\n", function(err) {
            if (err) {
              throw err;
            }
          });
        }
      });
    });

    child.stderr.on("data", (data: any) => {
      // console.log(data);
      let dd = (data + "").split("\n");

      dd.forEach(line => {
        if (line.trim().length != 0) {
          //console.info(line);
          fs.appendFile(
            logFile,
            this.getErrorLogLinePrefix() + line + "\n",
            function(err) {
              if (err) throw err;
            }
          );
        }
      });
    });

    child.on("error", err => {
      console.log("Failed to start subprocess.");
      console.error("err: " + err);
      this.stop();
    });

    child.on("exit", (code, signal) => {
      console.info("child process exit. Code: " + code + " Signal: " + signal);
      this.process = null;
    });
  }

  public simulationFinished() {
    this.coeLogPrinter.printRemaining();
    this.coeConsolePrinter.printRemaining();
  }
  
  public prepareSimulation() {
    fs.truncateSync(this.getLogFilePath());
    this.cbPrepSimCBs.forEach(val => {
      val();
    });
    if (this.coeLogPrinter) this.coeLogPrinter.stopPrintingRemaining();
    if (this.coeConsolePrinter) this.coeConsolePrinter.stopPrintingRemaining();
  }

  public subscribePrepareSimulationCallback(
    uiCrtlType: UICrtlType,
    callback: () => void
  ) {
    this.cbPrepSimCBs.set(uiCrtlType, callback);
  }

  // enable subscription to the coe log file if it exists, otherwise it is created
  public subscribe(callback: any) {
    let path = this.getLogFilePath();

    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, "");
    }
    this.coeConsolePrinter = new CoeLogPrinter(this.maxReadSize, callback);
    this.coeConsolePrinter.startWatching(this.getLogFilePath());
  }

  public subscribeLog4J(callback: any) {
    let logFile: string = this.getLog4JFilePath();

    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, "");
    }
    this.coeLogPrinter = new CoeLogPrinter(this.maxReadSize, callback);
    this.coeLogPrinter.startWatching(this.getLog4JFilePath());
  }

  public unloadPrintView(uiCrtlType: UICrtlType) {
    let logPrinterRef =
      uiCrtlType == UICrtlType.Console
        ? this.coeConsolePrinter
        : this.coeLogPrinter;
    logPrinterRef.stopWatching();
    logPrinterRef.stopPrintingRemaining();
    logPrinterRef.unsubscribe();
    if (this.cbPrepSimCBs.has(uiCrtlType)) {
      this.cbPrepSimCBs.delete(uiCrtlType);
    } else {
      console.log(`INFO: CoeProcess: Did not find prepSimCB for ${uiCrtlType}`);
    }
  }
}
