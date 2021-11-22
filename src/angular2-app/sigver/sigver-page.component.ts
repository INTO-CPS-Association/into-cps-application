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
import * as Path from 'path';
import * as Fs from 'fs';

@Component({
    selector: "sv-page",
    templateUrl: "./angular2-app/sigver/sigver-page.component.html",
    providers: [SigverConfigurationService]
})
export class SigverPageComponent implements OnDestroy {
    private _configurationChangedSub: Subscription;
    private _path: string = "";
    masterModel: string = "";
    cosConfPath: string = "";
    generationResultsPath: string = "";
    verificationResultsPath: string = "";
    executionResultsPath: string = "";
    disableSimulationBtn: boolean = true;

    @Input()
    set path(path: string) {
        this._path = path;
        this.sigverConfigurationService.configurationPath = this._path;
        this.sigverConfigurationService.loadConfigurationFromPath().then(
            () => this.ensureResultPaths(Path.join(this.sigverConfigurationService.configurationPath, "..", "results", Path.sep))
        ).catch(err => console.error(err));
    }
    get path(): string {
        return this._path;
    }

    constructor(private sigverConfigurationService: SigverConfigurationService) {
        this._configurationChangedSub = this.sigverConfigurationService.configurationChangedObservable.subscribe(() => {
            this.cosConfPath = sigverConfigurationService.configuration.coePath;
            this.masterModel = sigverConfigurationService.configuration.masterModel;
            this.disableSimulationBtn = this.masterModel == "";
        });
    }

    ngOnDestroy(): void {
        this._configurationChangedSub.unsubscribe();
    }


    ensureResultPaths(rootResultsPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.verificationResultsPath = Path.join(rootResultsPath, "verification");
            this.executionResultsPath = Path.join(rootResultsPath, "execution");
            this.generationResultsPath = Path.join(rootResultsPath, "generation");

            Promise.all([
                this.ensureDirectoryExistence(this.verificationResultsPath).catch(err => reject(err)),
                this.ensureDirectoryExistence(this.executionResultsPath).catch(err => reject(err)),
                this.ensureDirectoryExistence(this.generationResultsPath).catch(err => console.log(err))
            ]).then(() => resolve()).catch(err => reject(err));
        });
    }

    ensureDirectoryExistence(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (Fs.existsSync(filePath)) {
                resolve();
            }
            Fs.promises.mkdir(filePath, { recursive: true }).then(() => {
                resolve();
            }, err => {
                reject(err);
            });
        });
    }
}
