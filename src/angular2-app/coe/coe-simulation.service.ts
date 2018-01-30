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

import { FileSystemService } from "../shared/file-system.service";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import { Http, Response } from "@angular/http";
import { Serializer } from "../../intocps-configurations/Parser";
import { Fmu } from "./models/Fmu";
import { CoeConfig } from "./models/CoeConfig";
import * as Path from "path";
import { BehaviorSubject } from "rxjs/Rx";
import { Injectable, NgZone } from "@angular/core";
import { CoSimulationConfig, LiveGraph } from "../../intocps-configurations/CoSimulationConfig";
import { storeResultCrc } from "../../intocps-configurations/ResultConfig";
import * as http from "http"
import * as fs from 'fs'
import * as child_process from 'child_process'
import { TraceMessager } from "../../traceability/trace-messenger"
import DialogHandler from "../../DialogHandler"
import { Graph } from "../shared/graph"
import { Deferred } from "../../deferred"
import { CoeProcess } from "../../coe-server-status/CoeProcess"
import { IntoCpsApp } from "../../IntoCpsApp";


@Injectable()
export class CoeSimulationService {
    progress: number = 0;
    errorReport: (hasError: boolean, message: string) => void = function () { };
    simulationCompletedHandler: () => void = function () { };
    postProcessingOutputReport: (hasError: boolean, message: string) => void = function () { };

    private webSocket: WebSocket;
    private sessionId: number;
    private remoteCoe: boolean;
    private coe: CoeProcess; 
    private url: string;
    private resultDir: string;
    private config: CoSimulationConfig;
    private graphMaxDataPoints: number = 100;
    public graph: Graph = new Graph();;
    public externalGraphs: Array<DialogHandler> = new Array<DialogHandler>();

    constructor(private http: Http,
        private settings: SettingsService,
        private fileSystem: FileSystemService,
        private zone: NgZone) {

        this.graphMaxDataPoints = settings.get(SettingKeys.GRAPH_MAX_DATA_POINTS);
        this.graph.setProgressCallback((progress: number) => { this.progress = progress });
        this.graph.setGraphMaxDataPoints(this.graphMaxDataPoints);
    }

    reset() {
        this.progress = 0;
        this.zone.run(() => {
            this.graph.reset();
        });
    }

    run(config: CoSimulationConfig, errorReport: (hasError: boolean, message: string) => void, simCompleted: () => void, postScriptOutputReport: (hasError: boolean, message: string) => void) {
        this.coe = IntoCpsApp.getInstance().getCoeProcess();
        this.errorReport = errorReport;
        this.simulationCompletedHandler = simCompleted;
        this.config = config;
        this.postProcessingOutputReport = postScriptOutputReport;
        this.remoteCoe = this.settings.get(SettingKeys.COE_REMOTE_HOST);
        this.url = this.settings.get(SettingKeys.COE_URL);

        let currentDir = Path.dirname(this.config.sourcePath);
        let now = new Date();
        let nowAsUTC = new Date(Date.UTC(now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()));

        let dateString = nowAsUTC.toISOString().replace(/-/gi, "_")
            .replace(/T/gi, "-")
            .replace(/Z/gi, "")
            .replace(/:/gi, "_")
            .replace(/\./gi, "_");
        this.resultDir = Path.normalize(`${currentDir}/R_${dateString}`);

        this.reset();
        this.graph.setCoSimConfig(config);
        this.graph.initializeDatasets();
        this.coe.prepareSimulation();
        this.createSession();
    }

    stop() {
        this.http.get(`http://${this.url}/stopsimulation/${this.sessionId}`)
            .subscribe((response: Response) => { }, (err: Response) => this.errorHandler(err));
    }

    private createSession() {
        this.errorReport(false, "");

        this.http.get(`http://${this.url}/createSession`)
            .subscribe((response: Response) => {
                this.sessionId = response.json().sessionId;
                this.uploadFmus();
            });
    }

    private uploadFmus() {
        if (!this.remoteCoe) {
            this.initializeCoe();
            return;
        }

        let formData = new FormData();

        this.config.multiModel.fmus.forEach((value: Fmu) => {
            this.fileSystem.readFile(value.path).then(content => {
                formData.append(
                    'file',
                    new Blob([content], { type: "multipart/form-data" }),
                    value.path
                );
            });
        });

        this.http.post(`http://${this.url}/upload/${this.sessionId}`, formData)
            .subscribe(() => this.initializeCoe(), (err: Response) => this.errorHandler(err));
    }

    private initializeCoe() {
        let data = new CoeConfig(this.config, this.remoteCoe).toJSON();

        this.fileSystem.mkdir(this.resultDir)
            .then(() => this.fileSystem.writeFile(Path.join(this.resultDir, "config.json"), data))
            .then(() => {
                this.http.post(`http://${this.url}/initialize/${this.sessionId}`, data)
                    .subscribe(() => this.simulate(), (err: Response) => this.errorHandler(err));
            });
    }

    private simulate() {
        let deferreds = new Array<Promise<any>>();

        this.graph.graphMap.forEach((value: BehaviorSubject<any[]>, key: LiveGraph) => {
            if (key.externalWindow) {
                let deferred: Deferred<any> = new Deferred<any>();
                deferreds.push(deferred.promise);
                let graphObj = key.toObject();
                graphObj.webSocket = "ws://" + this.url + "/attachSession/" + this.sessionId;
                graphObj.graphMaxDataPoints = this.graphMaxDataPoints;
                console.log(graphObj);
                let dh = new DialogHandler("angular2-app/coe/graph-window/graph-window.html", 800, 600, null, null, null);
                dh.openWindow(JSON.stringify(graphObj), true);
                this.externalGraphs.push(dh);
                dh.win.webContents.on("did-finish-load", () => {
                    dh.win.setTitle("Plot: " + key.title);
                    deferred.resolve();
                });
            }
        });

        Promise.all(deferreds).then(() => {
            this.graph.launchWebSocket(`ws://${this.url}/attachSession/${this.sessionId}`);

            var message: any = {
                startTime: this.config.startTime,
                endTime: this.config.endTime,
                reportProgress: true,
                liveLogInterval: this.config.livestreamInterval
            };

            // enable logging for all log categories        
            var logCategories: any = new Object();
            let self = this;
            this.config.multiModel.fmuInstances.forEach(instance => {
                let key: any = instance.fmu.name + "." + instance.name;

                if (self.config.enableAllLogCategoriesPerInstance) {
                    logCategories[key] = instance.fmu.logCategories;
                }
            });
            Object.assign(message, { logLevels: logCategories });

            let data = JSON.stringify(message);

            this.fileSystem.writeFile(Path.join(this.resultDir, "config-simulation.json"), data)
                .then(() => {
                    this.http.post(`http://${this.url}/simulate/${this.sessionId}`, data)
                        .subscribe(() => {this.downloadResults(); this.graph.setFinished()}, (err: Response) => this.errorHandler(err));
                });
        });


    }

    errorHandler(err: Response) {
        console.warn(err);
        this.progress = 0;
        this.errorReport(true, "Error: " + err.text());

    }

    private downloadResults() {
        this.graph.closeSocket();
        this.externalGraphs.forEach((eg) => {
            if (eg.win)
                //This also causes a redraw event for the external graphs.
                eg.win.webContents.send("close");
        })
        this.simulationCompletedHandler();

        let resultPath = Path.normalize(`${this.resultDir}/outputs.csv`);
        let coeConfigPath = Path.normalize(`${this.resultDir}/coe.json`);
        let mmConfigPath = Path.normalize(`${this.resultDir}/mm.json`);
        let logPath = Path.normalize(`${this.resultDir}/log.zip`);

        this.http.get(`http://${this.url}/result/${this.sessionId}/plain`)
            .subscribe(response => {
                // Write results to disk and save a copy of the multi model and coe configs
                Promise.all([
                    this.fileSystem.writeFile(resultPath, response.text()),
                    this.fileSystem.copyFile(this.config.sourcePath, coeConfigPath),
                    this.fileSystem.copyFile(this.config.multiModel.sourcePath, mmConfigPath)
                ]).then(() => {
                    this.coe.simulationFinished();
                    this.progress = 100;
                    storeResultCrc(resultPath, this.config);
                    this.executePostProcessingScript(resultPath);
                });
            });


        var logStream = fs.createWriteStream(logPath);
        let url = `http://${this.url}/result/${this.sessionId}/zip`;
        var request = http.get(url, (response: http.IncomingMessage) => {
            response.pipe(logStream);
            response.on('end', () => {

                // simulation completed + result
                let message = TraceMessager.submitSimulationResultMessage(this.config.sourcePath, this.config.multiModel.sourcePath, [resultPath, coeConfigPath, mmConfigPath, logPath]);
                let destroySessionUrl = `http://${this.url}/destroy/${this.sessionId}`;
                http.get(destroySessionUrl, (response: any) => {
                    let statusCode = response.statusCode;
                    if (statusCode != 200)
                        console.error("Destroy session returned statuscode: " + statusCode)
                });
            });
        });
    }

    private createPanel(title: string, content: HTMLElement): HTMLElement {
        var divPanel = document.createElement("div");
        divPanel.className = "panel panel-default";

        var divTitle = document.createElement("div");
        divTitle.className = "panel-heading";
        divTitle.innerText = title;

        var divBody = document.createElement("div");
        divBody.className = "panel-body";
        divBody.appendChild(content);

        divPanel.appendChild(divTitle);
        divPanel.appendChild(divBody);

        return divPanel;
    }

    private executePostProcessingScript(outputFile: string) {

        let script: string = this.config.postProcessingScript;
        let self = this;

        //default will be '.'
        if (script == null || script.length <= 1)
            return;


        let scriptNormalized = Path.normalize(Path.join(this.config.projectRoot, script));
        var scriptExists = false;
        try {
            fs.accessSync(scriptNormalized, fs.constants.R_OK);
            scriptExists = true;

        } catch (e) {

        }

        if (scriptExists) {
            script = scriptNormalized;
        }

        var spawn = child_process.spawn;

        var child = spawn(script, ["\"" + outputFile + "\"", "" + this.config.endTime], {
            detached: true,
            shell: true,
            cwd: Path.dirname(outputFile)
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            self.postProcessingOutputReport(false, data + "");
        });

        child.stderr.on('data', function (data: any) {
            console.log('stderr: ' + data);
            self.postProcessingOutputReport(true, data + "");
        });
    }


}
