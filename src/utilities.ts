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


import Path = require('path');
import fs = require("fs");
import {IntoCpsApp} from  "./IntoCpsApp"


export class Utilities {
    public static timeStringToNumberConversion(text: string, setterFunc: (val: number) => void): boolean {
        let value = Number(text);
        if (isNaN(value)) {
            return false;
        }
        else {
            setterFunc(value);
            return true;
        }
    }

    public static projectRoot(): string {
        let app: IntoCpsApp = IntoCpsApp.getInstance();
        return app.getActiveProject().getRootFilePath();
    }

    public static getSystemArchitecture() {
        if (process.arch == "ia32") {
            return "32";
        } else if (process.arch == "x64") {
            return "64";
        } else {
            return process.arch;
        }
    }

    public static getSystemPlatform() {
        if (process.platform == "win32")
            return "windows";
        else
            return process.platform;
    }

    public static relativeProjectPath(path: string): string {
        if (!Path.isAbsolute(path)) {
            return Path.normalize(path);
        }
        var root: string = Utilities.projectRoot();
        return Path.relative(root, path);
    }

    public static absoluteProjectPath(path: string): string {
        if (Path.isAbsolute(path)) {
            return Path.resolve(path);
        }
        var root: string = Utilities.projectRoot();
        return Path.resolve(root, path);
    }

    public static pathIsInFolder(path: string, folder: string): boolean {
        var aPath: string[] = Utilities.absoluteProjectPath(path).split(Path.sep);
        var aFolder: string[] = Utilities.absoluteProjectPath(folder).split(Path.sep);
        var res: boolean = true;
        if (aPath.length < aFolder.length) {
            res = false;
        }
        for (var i = 0; i < aFolder.length; ++i) {
            if (aPath[i] != aFolder[i])
                res = false;
        }
        return res;
    }

    public static copyFile(source: string, target: string, callback: (error: string) => void) {
        // found at: http://stackoverflow.com/a/14387791
        let cbCalled = false;
        let error = false;
        let rd = fs.createReadStream(source);
        rd.on("error", report);
        let wr = fs.createWriteStream(target);
        wr.on("error", report);
        wr.on("close", () => { report(undefined); });
        rd.pipe(wr);
        function report(error: string) {
            if (!cbCalled) {
                callback(error);
                cbCalled = true;
            }
        }
    }

    public static pathToUri(path: string)
    {
        return encodeURI(path.replace(/\\/g, "/"))
    }

}
