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

import { Component, Input, AfterContentInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { MaestroDtpType } from "../../../intocps-configurations/dtp-configuration";
import IntoCpsApp from "../../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import { Project } from "../../../proj/Project";

@Component({
    selector: 'maestro',
    templateUrl: "./angular2-app/dtp/inputs/maestro.component.html"
})
export class DtpMaestroComponent implements AfterContentInit{

    @Input()
    dtptype: MaestroDtpType

    @Input()
    formGroup: FormGroup;

    @Input()
    editing: boolean = false;

    @Input()
    configpath: string = "";

    baseExperimentPath: string = "";

    baseOnExperiment: boolean = false;

    experimentsPaths: string[] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));

    showFirstTimeSetupBtns: boolean = false;

    showExperimentSelect: boolean = false;

    constructor() {
        console.log("Maestro component constructor");
    }

    ngAfterContentInit(): void {
        if(this.dtptype.multiModelPath != ""){
            if(fs.existsSync(this.dtptype.multiModelPath)){
                return;
            }
            else {
                console.error(`Unable to locate multi-model at: ${this.dtptype.multiModelPath}.`);
            }
        }
        this.showFirstTimeSetupBtns = true;
    }

    hasUniqueName(): boolean {
        return this.formGroup.parent.hasError('notUnique') && this.formGroup.parent.errors.notUnique === this.dtptype.name;
    }

    onBaseExperimentChanged(){
        if (!fs.existsSync(this.baseExperimentPath)) {
            return;
        }
        const mm_destinationName = Path.join(Path.dirname(this.configpath), this.dtptype.name + "_multiModel.json");
        const mm_sourcePath = Path.join(this.baseExperimentPath, "..");
        fs.readdir(mm_sourcePath, (err, files) => {
            if (files) {
                const mm_name = files.find(fileName => fileName.toLowerCase().endsWith("mm.json"));
                if (mm_name) {
                    const mm_sourceName = Path.join(mm_sourcePath, mm_name);
                    fs.copyFile(mm_sourceName, mm_destinationName, (err) => {
                        if (err) {
                            console.error(`Unable to copy multi model from: ${mm_sourceName} to ${mm_destinationName}: "${err}"`);
                        }
                        else {
                            this.dtptype.multiModelPath = mm_destinationName;
                        }
                    });
                }
                else {
                    console.error(`Unable to locate multi model in: ${mm_sourcePath}.`);
                }
            } else {
                console.error(`Unable to read directory: ${mm_sourcePath}: "${err}."`);
            }
        });
        this.showExperimentSelect = false;
    }

    doFirstTimeSetup(setupFromExperiment: boolean) {
        this.showFirstTimeSetupBtns = false;
        this.showExperimentSelect = setupFromExperiment;
        if(!setupFromExperiment){
            this.dtptype.multiModelPath = Path.join(Path.dirname(this.configpath), this.dtptype.name + "_multiModel.json");
            fs.writeFileSync(this.dtptype.multiModelPath, "{}", 'utf-8');
        }
    }

    getExperimentNameFromPath(path: string, depth: number): string {
        let elems = path.split(Path.sep);
        if (elems.length <= 1) {
            return path;
        }
        let pathToReturn = "";
        for (let i = depth; i >= 1; i--) {
            pathToReturn += elems[elems.length - i] + (i == 1 ? "" : " | ");
        }
        return pathToReturn;
    }

    getExperimentsPaths(path: string): string[] {
        let experimentPaths: string[] = []
        let files = fs.readdirSync(path);
        if (files.findIndex(f => f.endsWith("coe.json")) != -1) {
            experimentPaths.push(path);
        }
        else {
            for (let i in files) {
                let fileName = Path.join(path, files[i]);
                if (fs.statSync(fileName).isDirectory()) {
                    experimentPaths = experimentPaths.concat(this.getExperimentsPaths(fileName));
                }
            }
        }
        return experimentPaths;
    }
}

