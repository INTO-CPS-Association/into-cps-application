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
import {FileSystemService} from "./shared/file-system.service";
import {CoePageComponent} from "./coe/coe-page.component";
import {HTTP_PROVIDERS, Http} from "@angular/http";
import {SettingsService} from "./shared/settings.service";
import {MmPageComponent} from "./mm/mm-page.component";
import {TrPageComponent} from "./tr/tr-page.component";
import {DsePageComponent} from "./dse/dse-page.component";
import {CoSimulationConfig} from "../intocps-configurations/CoSimulationConfig";
import IntoCpsApp from "../IntoCpsApp";
import {MultiModelConfig} from "../intocps-configurations/MultiModelConfig";
import {CoeSimulationService} from "./coe/coe-simulation.service";
import {NavigationService} from "./shared/navigation.service";

interface MyWindow extends Window {
    ng2app: AppComponent;
}

declare let window: MyWindow;

// Main application component.
// Handles routing between the pages that use Angular 2.

@Component({
    selector: 'app',
    directives: [
        MmPageComponent,
        CoePageComponent,
        DsePageComponent,
        TrPageComponent
    ],
    providers: [
        HTTP_PROVIDERS,
        FileSystemService,
        SettingsService,
        NavigationService
    ],
    template: `
        <mm-page *ngIf="page === 'multiModel'" [path]="path"></mm-page>
        <coe-page *ngIf="page === 'coe'" [path]="path"></coe-page>
        <dse-page *ngIf="page === 'dse'" [path]="path"></dse-page>
        <tr-page *ngIf="page === 'tr'" [path]="path"></tr-page>`
})
export class AppComponent implements OnInit {
    private page:string;
    private path:string;

    constructor(public navigationService:NavigationService,
                private http:Http,
                private settings:SettingsService,
                private fileSystem:FileSystemService,
                private zone:NgZone) {

    }

    ngOnInit() {
        // Expose the Angular 2 application for the rest of the INTO-CPS application
        window.ng2app = this;
    }

    // Allows accessing the coe simulation service outside of Angular.
    makeCoeSimulationService() {
        return new CoeSimulationService(this.http, this.settings, this.fileSystem, this.zone);
    }

    openCOE(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = "coe";
        });
    }

    openMultiModel(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = "multiModel";
        });
    }

    openTraceability():void {
        this.zone.run(() => {
            this.page = "tr";
        });
    }

    openDSE(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = "dse";
        });
    }

    closeAll():void {
        this.zone.run(() => {
            this.path = null;
            this.page = null;
        });
    }
}
