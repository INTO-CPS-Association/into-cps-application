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

import { Component, OnInit, NgZone } from '@angular/core';
import { FileSystemService } from "../../shared/file-system.service";
import { HTTP_PROVIDERS, Http } from "@angular/http";
import { LineChartComponent } from "../../shared/line-chart.component";
import { BehaviorSubject } from "rxjs/Rx";
import { LiveGraph } from "../../../intocps-configurations/CoSimulationConfig";
import { Graph } from "../../shared/graph"
import { ipcRenderer } from "electron";




interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare let window: MyWindow;

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    directives: [LineChartComponent],
    providers: [
        HTTP_PROVIDERS,
        FileSystemService
    ],
    templateUrl: "./graph.component.html"
})
export class AppComponent implements OnInit {
    private webSocket: WebSocket;
    graph: Graph = new Graph();

    constructor(private http: Http,
        private fileSystem: FileSystemService,
        private zone: NgZone) {

    }

    initializeGraph(data: any) {
        let dataObj = JSON.parse(data);
        this.zone.run(() => {
            this.graph.setGraphMaxDataPoints(dataObj.graphMaxDataPoints);
            let lg: LiveGraph = new LiveGraph();
            lg.fromObject(dataObj.livestream,dataObj.title);      
            this.graph.initializeSingleDataset(lg);        
            this.graph.launchWebSocket(dataObj.webSocket)
        });
        ipcRenderer.on('close', (event, data) => { this.graph.closeSocket(); this.graph.setFinished();});
        window.onbeforeunload = ((ev) => {
           this.graph.closeSocket();       
        });
    }

    ngOnInit() {
    }
}
