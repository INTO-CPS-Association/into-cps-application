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
import { Http } from "@angular/http";
import { LiveGraph } from "../../../intocps-configurations/CoSimulationConfig";
import { Graph } from "../../shared/graph"
import { ipcRenderer } from "electron";

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    templateUrl: "./graph.component.html"
})
export class AppComponent implements OnInit {
    graph: Graph = new Graph();

    constructor(private http: Http,
        private fileSystem: FileSystemService,
        private zone: NgZone) {
            console.log("Graph Window App Component")
    }

    initializeGraph() {
        /* let dataObj = JSON.parse(data); */
        let dataObj = JSON.parse(this.getParameterByName("data"));
        this.zone.run(() => {
            this.graph.setGraphMaxDataPoints(dataObj.graphMaxDataPoints);
            let lg: LiveGraph = new LiveGraph();
            lg.fromObject(dataObj.livestream,dataObj.title);      
            this.graph.initializeSingleDataset(lg);        
            this.graph.launchWebSocket(dataObj.webSocket)
        });
        ipcRenderer.on('close', () => { this.graph.closeSocket(); this.graph.setFinished();});
        window.onbeforeunload = ((ev: any) => {
           this.graph.closeSocket();       
        });
    }
// Retrieves the query string value associated with name
private getParameterByName(name: string, url?: string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
    ngOnInit() {
        console.log("Graph Window App Component On Init");
        this.initializeGraph();
    }
}
