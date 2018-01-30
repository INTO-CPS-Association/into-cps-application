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
import Path = require("path");
import { SettingKeys } from "../settings/SettingKeys";
import { Utilities } from "../utilities";

export class RTTester {

    public static getProjectOfFile(path: string) {
        let relPath = Utilities.relativeProjectPath(path);
        let pathComp = relPath.split(Path.sep);
        let root = Utilities.projectRoot();
        return Path.resolve(Path.join(root, pathComp[0], pathComp[1]));
    }

    public static getRelativePathInProject(path: string) {
        let relPath = Utilities.relativeProjectPath(path);
        let pathComp = relPath.split(Path.sep);
        return pathComp.splice(2).join(Path.sep);
    }

    public static getUtilsPath(fileInProject: string) {
        return Path.join(RTTester.getProjectOfFile(fileInProject), "utils");
    }

    public static simulationFMU(testCase: string, component: string) {
        return Path.join(RTTester.getProjectOfFile(testCase),
            "RTT_TestProcedures", "Simulation", component + "_simulation.fmu");
    }

    public static genericCommandEnv(path: string) {
        let env: any = process.env;
        env["RTT_TESTCONTEXT"] = RTTester.getProjectOfFile(path);
        env["RTTDIR"] = RTTester.rttInstallDir();
        env["RTT_OP_KEY"] = "TMS:19999:FMI";
        env["OSLC_ENABLED"] = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.ENABLE_TRACEABILITY) ? 1 : 0;
        env["OSLC_PORT"] = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.TRACE_DAEMON_PORT);
        return env;
    }

    public static openFileInGUI(path: string) {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        let rttui = Path.normalize(<string>settings.getSetting(SettingKeys.RTTESTER_RTTUI));
        let projectToOpen = RTTester.getProjectOfFile(path);
        let fileToOpen = RTTester.getRelativePathInProject(path);
        let args: string[] = ["--open-file", fileToOpen, projectToOpen];
        console.log("Spawn \"" + rttui + "\" with options [" + args + "].");
        const spawn = require("child_process").spawn;
        const process = spawn(rttui, args, { detached: true, stdio: ["ignore"] });
        process.unref();
    }

    public static pythonExecutable(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_PYTHON));
    }

    public static rttInstallDir(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_INSTALL_DIR));
    }

    public static rttMBTInstallDir(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        let settings = app.getSettings();
        return Path.normalize(settings.getSetting(SettingKeys.RTTESTER_MBT_INSTALL_DIR));
    }

    public static genericMBTPythonCommandSpec(path: string, command: string): any {
        let script = Path.normalize(Path.join(RTTester.rttMBTInstallDir(), "bin", command));
        let tp = RTTester.getRelativePathInProject(path);
        return {
            command: RTTester.pythonExecutable(),
            arguments: [script, tp],
            options: { env: RTTester.genericCommandEnv(path) }
        };
    }

    public static queueEvent(action: string, context: string, tp: string = null, extra: string = null): void {
        context = RTTester.getProjectOfFile(context);
        let exe = RTTester.pythonExecutable();
        let utilsPath = RTTester.getUtilsPath(context);
        let script = Path.normalize(Path.join(utilsPath, "rtt-fmi-queue-event.py"));
        let args = [script, action, context];
        if (tp != null) args.push(tp);
        if (extra != null) args.push(extra);
        let env: any = RTTester.genericCommandEnv(context);
        const cp = require("child_process");
        let ret = cp.spawnSync(exe, args, { env: env, cwd: utilsPath });
        console.log(ret.stdout.toString());
        console.log(ret.stderr.toString());
    }

    public static reportEvents(context: string): void {
        context = RTTester.getProjectOfFile(context);
        let exe = RTTester.pythonExecutable();
        let utilsPath = RTTester.getUtilsPath(context);
        let script = Path.normalize(Path.join(utilsPath, "rtt-fmi-report-queue.py"));
        let args = [script];
        let env: any = RTTester.genericCommandEnv(context);
        const cp = require("child_process");
        let ret = cp.spawnSync(exe, args, { env: env, cwd: utilsPath });
        console.log(ret.stdout.toString());
        console.log(ret.stderr.toString());
    }

}
