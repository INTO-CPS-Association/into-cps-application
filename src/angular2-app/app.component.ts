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
/* import {Http} from "@angular/http"; */
import { HttpClient } from '@angular/common/http';
import {SettingsService} from "./shared/settings.service";
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
    template: `
        <mm-page *ngIf="page === 'multiModel'" [path]="path"></mm-page>
         <coe-page *ngIf="page === 'coe'" [path]="path"></coe-page>
         <dse-page *ngIf="page === 'dse'" [path]="path"></dse-page>
         <dtp-page *ngIf="page === 'dtp'" [path]="path"></dtp-page>
         <sv-page *ngIf="page === 'sv'" [path]="path"></sv-page>`
})
export class AppComponent implements OnInit {
    private page:string;
    private path:string;

    constructor(public navigationService:NavigationService,
                private http:HttpClient,
                private settings:SettingsService,
                private fileSystem:FileSystemService,
                private zone:NgZone) {
                    console.log("appComponent");

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

    openDTP(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = "dtp";
        });
    }


    openSV(path: string):void {
        this.zone.run(() => {
            this.path = path;
            this.page = "sv";
        });
    }

    closeAll():void {
      /*   this.zone.run(() => { */
            this.path = null;
            this.page = null;
 /*        }); */
    }
}
