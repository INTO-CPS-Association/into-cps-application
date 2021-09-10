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

import {Component, Input, AfterViewInit, OnInit} from "@angular/core";
import { SvConfiguration } from "../../intocps-configurations/sv-configuration";
import * as fs from 'fs';

@Component({
    selector: "sv-page",
    templateUrl: "./angular2-app/sv/sv-page.component.html"
})
export class SvPageComponent{
    @Input()
    private _path: string;
    svconfiguration: SvConfiguration;
    isNewConfiguration: boolean = true;

    @Input()
    set path(path:string) {
        this._path = path;

        let file = fs.readFileSync(this._path);

        if (file == undefined){
            console.error(`Unable to read configuration file: ${this._path}`)
        }
        else{
            try{
                this.svconfiguration = SvConfiguration.createFromJsonString(file.toString());
                this.isNewConfiguration = this.svconfiguration.experimentPath == "";
            }
            catch(Ex){
                console.error(`Unable parse the SV configuration: ${Ex}`)
            }
        }
    }
    get path():string {
        return this._path;
    }

    onConfigurationChanged(config: SvConfiguration) {
        this.svconfiguration = config;

        // Save the configuration
        fs.writeFile(this.path, this.svconfiguration.serializeToJsonString(), error => {
            if (error){
                console.error(`Unable to write configuration to file: ${error}`)
            }
        });
    }
}
