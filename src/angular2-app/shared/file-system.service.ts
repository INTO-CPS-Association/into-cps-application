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

import {Injectable, NgZone} from "@angular/core";
import * as fs from "fs";

// This service wraps the Node.JS filesystem API.

@Injectable()
export class FileSystemService {
    constructor(private zone:NgZone) {

    }

    // Wrap the filesystem API in a promise and the Angular zone
    private wrap(fn:(resolve:Function, reject:Function) => void) {
        return new Promise((resolve, reject) => {
            this.zone.run(() => fn(resolve, reject));
        });
    }

    readFile(path:string):Promise<string> {
        return this.wrap((reject, resolve) => {
            fs.readFile(path, "utf8", (error, data) => {
                if (error)
                    reject(error);
                else
                    resolve(data);
            });
        });
    }

    writeFile(path:string, content:string) {
        return this.wrap((resolve, reject) => {
            fs.writeFile(path, content, "utf8", (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    copyFile(source:string, target:string) {
        return this.wrap((resolve, reject) => {
            let read = fs.createReadStream(source);
            read.on("error", (error:Error) => reject(error));

            let write = fs.createWriteStream(target);
            write.on("error", (error:Error) => reject(error));
            write.on("close", () => resolve());

            read.pipe(write);
        });
    }

    mkdir(path:string) {
        return this.wrap((resolve, reject) => {
            fs.mkdir(path, error => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}
