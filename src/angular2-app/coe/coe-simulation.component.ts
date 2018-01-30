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

import { Component, Input, NgZone, OnInit, OnDestroy } from "@angular/core";
import { CoSimulationConfig } from "../../intocps-configurations/CoSimulationConfig";
import { LineChartComponent } from "../shared/line-chart.component";
import { CoeSimulationService } from "./coe-simulation.service";
import { Http } from "@angular/http";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import IntoCpsApp from "../../IntoCpsApp";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { openCOEServerStatusWindow } from "../../menus";
import {CoeProcess} from "../../coe-server-status/CoeProcess";

@Component({
    selector: "coe-simulation",
    providers: [
        CoeSimulationService
    ],
    directives: [
        LineChartComponent
    ],
    templateUrl: "./angular2-app/coe/coe-simulation.component.html"
})
export class CoeSimulationComponent implements OnInit, OnDestroy {
    private _path: string;

    @Input()
    set path(path: string) {
        this._path = path;

        if (path) {
            this.parseConfig();

            if (this.coeSimulation)
                this.coeSimulation.reset();
        }
    }
    get path(): string {
        return this._path;
    }

    online: boolean = false;
    hasHttpError: boolean = false;
    httpErrorMessage: string = '';
    url: string = '';
    version: string = '';
    config: CoSimulationConfig;
    mmWarnings: WarningMessage[] = [];
    coeWarnings: WarningMessage[] = [];
    hasPostScriptOutput = false;
    hasPostScriptOutputError = false;
    postScriptOutput = '';
    simulating: boolean = false;

    private onlineInterval: number;
    private parsing: boolean = false;

    constructor(
        private coeSimulation: CoeSimulationService,
        private http: Http,
        private zone: NgZone,
        private settings: SettingsService
    ) {

    }

    ngOnInit() {
        this.url = CoeProcess.getCoeVersionUrl();
        this.onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();
        this.parsing = true;

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => this.zone.run(() => {
                this.config = config;

                this.mmWarnings = this.config.multiModel.validate();
                this.coeWarnings = this.config.validate();

                this.parsing = false;
            }));
    }

    canRun() {
        return this.online
            && this.mmWarnings.length === 0
            && this.coeWarnings.length === 0
            && !this.parsing;
    }

    runSimulation() {
        this.zone.run(() => {
            this.hasHttpError = false;
            this.hasPostScriptOutput = false;
            this.hasPostScriptOutputError = false;
            this.postScriptOutput = "";
            this.simulating = true;
        });



        this.coeSimulation.run(this.config,
            (e, m) => { this.zone.run(() => { this.errorHandler(e, m) }) },
            () => { this.zone.run(() => { this.simulating = false }) },
            (e, m) => { this.zone.run(() => { this.postScriptOutputHandler(e, m) }) }
        );


    }

    stopSimulation() {
        this.zone.run(() => {

            this.simulating = false;
        });
        this.coeSimulation.stop();

    }

    errorHandler(hasError: boolean, message: string) {

        this.hasHttpError = hasError;
        this.httpErrorMessage = message;
        if(hasError)
            this.simulating = false;
    }

    postScriptOutputHandler(hasError: boolean, message: string) {

        this.hasPostScriptOutput = true;
        this.hasPostScriptOutputError = hasError;
        this.postScriptOutput = message;

    }

    isCoeOnline() {
        this.http
            .get(this.url)
            .timeout(2000)
            .map(response => response.json())
            .subscribe((data: any) => {
                this.online = true;
                this.version = data.version;
            }, () => this.online = false);
    }

    onCoeLaunchClick() {
        openCOEServerStatusWindow("autolaunch", false)
    }
}
