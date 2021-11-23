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

import { Component, Input} from "@angular/core";
import { DTPConfig } from "../../intocps-configurations/dtp-configuration";
import { DtpDtToolingService } from "./dtp-dt-tooling.service";
import * as Path from 'path';

@Component({
    selector: "dtp-page",
    templateUrl: "./angular2-app/dtp/dtp-page.component.html",
    providers: [DtpDtToolingService]
})
export class DtpPageComponent {
    private _path : string;
    private config: DTPConfig = new DTPConfig();
    private configIsLoaded: boolean = false;

    @Input()
    set path(path: string){
        this._path = path;
        
        if (path) {
            this.dtpToolingService.startServer(Path.dirname(this._path));
            const projectPath = Path.dirname(path);
            this.parseConfig(Path.basename(projectPath), projectPath);
        }
    }

    get path(){
        return this._path;
    }
    
    constructor(private dtpToolingService: DtpDtToolingService) {
    }

    private ensureProjectEsists(projectName: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            this.dtpToolingService.getProjects().then((projectNames: string[]) => {
                if(projectNames.findIndex(name => projectName == name) == -1){
                    this.dtpToolingService.createProject(projectName).then(() => resolve()).catch(err => reject(err));
                } else {
                    resolve();
                }
            }).catch(err => reject(err));
        });
    }

    private parseConfig(projectName: string, projectPath: string) {
        this.ensureProjectEsists(projectName).then(() => {
            this.dtpToolingService.getProject(projectName).then(yamlConf => {
                // Create a form group for each DTPType
                this.config = DTPConfig.createFromYamlConfig(yamlConf, projectName, projectPath);
                this.configIsLoaded = true;
                console.log("Parsed DTP config!");
            }).catch(err => console.warn(err));
        }).catch(err => console.warn(err));
    }
}
