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

import { Component, Input, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { SigverConfigurationService } from "./sigver-configuration.service";

@Component({
    selector: "sv-page",
    templateUrl: "./angular2-app/sigver/sigver-page.component.html",
    providers: [SigverConfigurationService]
})
export class SigverPageComponent implements OnDestroy {
    private _configurationChangedSub: Subscription;
    private _path: string;
    private _masterModel: string;

    @Input()
    set path(path: string) {
        this._path = path;
        this.sigverConfigurationService.configurationPath = this._path;
        this.sigverConfigurationService.loadConfigurationFromPath().catch(err => console.error(err));
    }
    get path(): string {
        return this._path;
    }

    cosConfPath: string = "";

    constructor(private sigverConfigurationService: SigverConfigurationService) { 
        this._configurationChangedSub = this.sigverConfigurationService.configurationChangedObservable.subscribe(() => {
            this.cosConfPath = sigverConfigurationService.configuration.coePath;
            this._masterModel = sigverConfigurationService.configuration.masterModel;
        });
    }

    ngOnDestroy(): void {
        this._configurationChangedSub.unsubscribe();
    }
    
}
