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

export function getCustomFs(): any {
    var fs = require('fs');
    fs.removeRecursive = function (path: string, cb: (err: any, v: any) => void) {
        var self = this;

        fs.stat(path, function (err: any, stats: any) {
            if (err) {
                cb(err, stats);
                return;
            }
            if (stats.isFile()) {
                fs.unlink(path, function (err: any) {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(null, true);
                    }
                    return;
                });
            } else if (stats.isDirectory()) {
                // A folder may contain files
                // We need to delete the files first
                // When all are deleted we could delete the 
                // dir itself
                fs.readdir(path, function (err: any, files: any) {
                    if (err) {
                        cb(err, null);
                        return;
                    }
                    var f_length = files.length;
                    var f_delete_index = 0;

                    // Check and keep track of deleted files
                    // Delete the folder itself when the files are deleted

                    var checkStatus = function () {
                        // We check the status
                        // and count till we r done
                        if (f_length === f_delete_index) {
                            fs.rmdir(path, function (err: any) {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    cb(null, true);
                                }
                            });
                            return true;
                        }
                        return false;
                    };
                    if (!checkStatus()) {
                        for (var i = 0; i < f_length; i++) {
                            // Create a local scope for filePath
                            // Not really needed, but just good practice
                            // (as strings arn't passed by reference)
                            (function () {
                                var filePath = path + '/' + files[i];
                                // Add a named function as callback
                                // just to enlighten debugging
                                fs.removeRecursive(filePath, function removeRecursiveCB(err: any, status: any) {
                                    if (!err) {
                                        f_delete_index++;
                                        checkStatus();
                                    } else {
                                        cb(err, null);
                                        return;
                                    }
                                });

                            })()
                        }
                    }
                });
            }
        });
    };
    return fs;
}
