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

import { BehaviorSubject } from "rxjs/Rx";
import { CoSimulationConfig, LiveGraph } from "../../intocps-configurations/CoSimulationConfig";
import { SettingsService, SettingKeys } from "../shared/settings.service";
import { Serializer } from "../../intocps-configurations/Parser";

export class Graph {
    private config: CoSimulationConfig;
    graphMap: Map<LiveGraph, BehaviorSubject<Array<any>>> = new Map();
    private counter: number = 0;
    private graphMaxDataPoints: number = 100;
    private webSocket: WebSocket;
    private external = false;
    private progressCallback: (n: number) => void;
    finished : boolean ;


    public setFinished()
    {
        this.finished = true;
    }

    public setProgressCallback(progressCallback?: (n: number) => void) {
        if (progressCallback)
            this.progressCallback = progressCallback;
    }

    public setExternal(external: boolean) { this.external = external; }

    public setGraphMaxDataPoints(graphMaxDataPoints: number, ) {
        this.graphMaxDataPoints = graphMaxDataPoints;
    }

    public setCoSimConfig(config: CoSimulationConfig) {
        this.config = config;
    }

    public reset() {
        this.finished = false;
        this.graphMap.clear();
    }

    public getDataset(graph: LiveGraph): BehaviorSubject<Array<any>> {
        return this.graphMap.get(graph);
    }

    public getGraphs(): LiveGraph[] {
        return Array.from(this.graphMap.keys());
    }
    public getInternalGraphs() : LiveGraph[] {
        return Array.from(this.graphMap.keys()).filter((x: LiveGraph) => { return !x.externalWindow; });
    }

    public initializeSingleDataset(g: LiveGraph) {
        this.graphMap.clear();
        let ds = new BehaviorSubject([]);
        this.graphMap.set(g, ds);
        this.getGraphs();
        let datasets: Array<any> = [];
        g.getSerializedLiveStream().forEach((value: any, index: any) => {
            value.forEach((sv: any) => {
                let qualifiedName = index + "." + sv;
                datasets.push({
                    name: qualifiedName,
                    y: [],
                    x: []
                });
            });
        });
        ds.next(datasets);
    }
    public initializeDatasets() {
        this.finished = false;
        this.graphMap.clear();

        this.config.liveGraphs.forEach(g => {

            let ds = new BehaviorSubject([]);
            this.graphMap.set(g, ds);

            let datasets: Array<any> = [];

            g.getLivestream().forEach((value: any, index: any) => {

                value.forEach((sv: any) => {
                    let qualifiedName = Serializer.getIdSv(index, sv);
                    datasets.push({
                        name: qualifiedName,
                        y: [],
                        x: []
                    })
                });
            });

            ds.next(datasets);
        });
    }
    public launchWebSocket(webSocket: string) {
        console.log("launching websocket: " + webSocket);
        this.counter = 0;
        this.webSocket = new WebSocket(webSocket);

        this.webSocket.addEventListener("error", event => console.error(event));
        this.webSocket.addEventListener("message", event => this.onMessage(event));
    }
    private onMessage(event: MessageEvent) {
        let rawData = JSON.parse(event.data);
        let graphDatasets: Map<BehaviorSubject<Array<any>>, any> = new Map<BehaviorSubject<Array<any>>, any>();
        this.graphMap.forEach(ds => { graphDatasets.set(ds, ds.getValue()) });

        let newCOE = false;
        let xValue = this.counter++;
        //Preparing for new livestream messages. It has the following structure:
        // {"data":{"{integrate}":{"inst2":{"output":"0.0"}},"{sine}":{"sine":{"output":"0.0"}}},"time":0.0}}
        if ("time" in rawData) {
            xValue = rawData.time;
            if (this.progressCallback) {
                if (rawData.time < this.config.endTime) {
                    let pct = (rawData.time / this.config.endTime) * 100;
                    this.progressCallback(Math.round(pct));
                } else {
                    this.progressCallback(100);
                }
            }
            rawData = rawData.data;
        }

        Object.keys(rawData).forEach(fmuKey => {
            if (fmuKey.indexOf("{") !== 0) return;

            Object.keys(rawData[fmuKey]).forEach(instanceKey => {

                Object.keys(rawData[fmuKey][instanceKey]).forEach(outputKey => {
                    let value = rawData[fmuKey][instanceKey][outputKey];

                    if (value == "true") value = 1;
                    else if (value == "false") value = 0;

                    graphDatasets.forEach((ds: any, index: any) => {

                        let dataset = ds.find((dataset: any) => dataset.name === `${fmuKey}.${instanceKey}.${outputKey}`);
                        if (dataset) {
                            dataset.y.push(value);
                            dataset.x.push(xValue);
                            this.truncateDataset(dataset, this.graphMaxDataPoints);
                        }
                    })
                });
            });
        });

        graphDatasets.forEach((value: any, index: BehaviorSubject<any[]>) => {
            index.next(value);
        });
    }

    private truncateDataset(ds: any, maxLen: number) {
        let x: Number[] = <Number[]>ds.x;
        let size = x.length;
        if (size > maxLen) {
            ds.x = x.slice(size - maxLen, size)
            ds.y = ds.y.slice(size - maxLen, size)
        }
    }

    public closeSocket() {
        this.webSocket.close();
    }
}
