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

import { Component, Input } from "@angular/core";
import { DTPConfig } from "./dtp-configuration";
import { DtpDtToolingService } from "./dtp-dt-tooling.service";
import * as Path from "path";
import { Subscription } from "rxjs";

@Component({
    selector: "dtp-page",
    templateUrl: "./angular2-app/dtp/dtp-page.component.html",
    providers: [DtpDtToolingService],
})
export class DtpPageComponent {
    private _path: string;
    private _connectionAttempts: number = 0;
    private isToolingServerOnlineSub: Subscription;
    protected _config: DTPConfig = new DTPConfig();
    protected configIsLoaded: boolean = false;
    protected statusMsg: string = "Connecting to DTP tooling server...";
    private readonly _noConnectionMsg: string = "Unable to connect to the DTP tooling server";

    @Input()
    set path(path: string) {
        this._path = path;
        if (path) {
            if (!this.dtpToolingService.latestServerOnlineStatus) {
                if (this.dtpToolingService.spawnServer(Path.join(Path.dirname(this._path), ".."))) {
                    this.dtpToolingService.updateServerOnlineStatus().then((isOnline) => {
                        if (isOnline) {
                            const projectPath: string = Path.dirname(this._path);
                            this.parseConfig(Path.basename(projectPath), projectPath);
                        } else {
                            if (!this.isToolingServerOnlineSub) {
                                this.isToolingServerOnlineSub = this.dtpToolingService.isOnlineObservable.subscribe((isOnline) => {
                                    this._connectionAttempts++;
                                    if (isOnline) {
                                        this.isToolingServerOnlineSub.unsubscribe();
                                        this.isToolingServerOnlineSub = null;
                                        const projectPath: string = Path.dirname(this._path);
                                        this.parseConfig(Path.basename(projectPath), projectPath);
                                    } else if ((this._connectionAttempts = 2)) {
                                        this.displayErrorMsg(
                                            `Unable to connect to the DTP tooling server on URL '${this.dtpToolingService.url}'`
                                        );
                                    }
                                });
                            }
                        }
                    });
                } else {
                    this.displayErrorMsg(`Unable to start the server on URL '${this.dtpToolingService.url}'`);
                }
            } else {
                const projectPath: string = Path.dirname(this._path);
                this.parseConfig(Path.basename(projectPath), projectPath);
            }
        }
    }

    get path() {
        return this._path;
    }

    constructor(private dtpToolingService: DtpDtToolingService) {}

    ngOnDestroy() {
        this.isToolingServerOnlineSub?.unsubscribe();
    }

    private ensureProjectExsists(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.dtpToolingService
                .getProjects()
                .then((projectNames: string[]) => {
                    if (projectNames.findIndex((name) => projectName == name) == -1) {
                        this.dtpToolingService
                            .createProject(projectName)
                            .then(() => resolve())
                            .catch((err) => reject(err));
                    } else {
                        resolve();
                    }
                })
                .catch((err) => resolve(err));
        });
    }

    private parseConfig(projectName: string, projectPath: string) {
        this.ensureProjectExsists(projectName)
            .then(() => {
                this.dtpToolingService
                    .getProject(projectName)
                    .then((yamlConf) => {
                        this.dtpToolingService.getSchemaDefinition().then((schema) => {
                            this._config = DTPConfig.createFromYamlObj(yamlConf, projectName, projectPath);
                            this._config.signalDataTypes = schema["$defs"]?.["signal_type"]?.["enum"] ?? [];
                            this._config.serverTypes = schema["$defs"]?.["server_type"]?.["enum"] ?? [];
                            this.configIsLoaded = true;
                            console.log("Parsed DTP config from server");
                        });
                    })
                    .catch((err) => {
                        this.dtpToolingService
                            .updateServerOnlineStatus()
                            .then((isOnline) =>
                                this.displayErrorMsg(
                                    isOnline
                                        ? `Unable to fetch project from server: ${err}`
                                        : `${this._noConnectionMsg}. Server URL:  ${this.dtpToolingService.url}`
                                )
                            );
                    });
            })
            .catch((err) => {
                this.dtpToolingService
                    .updateServerOnlineStatus()
                    .then((isOnline) =>
                        this.displayErrorMsg(
                            isOnline
                                ? `Unable to determine if project exists: ${err}`
                                : `${this._noConnectionMsg}. Server URL:  ${this.dtpToolingService.url}`
                        )
                    );
            });
    }

    private displayErrorMsg(msg: string, logErr?: string) {
        this.statusMsg = msg;
        console.warn(logErr ? logErr : msg);
    }
}
