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
import { DTPConfig, IDtpItem, MaestroDtpItem, ToolDtpItem, ToolType } from "../dtp-configuration";
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
    maestro: MaestroDtpItem

    @Input()
    formGroup: FormGroup;
    
    @Input()
    editing: boolean = true;

    @Input()
    config: DTPConfig;

    baseExperimentPath: string = "";

    baseOnExperiment: boolean = false;

    experimentsPaths: string[] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));

    showInitialSetupBtns: boolean = false;

    showExperimentSelect: boolean = false;

    constructor() {}

    simulationNamesFromTools(tools: IDtpItem[]): string[] {
        return tools.reduce((maestroToolNames: string[], tool: ToolDtpItem) => {
            if(tool.type == ToolType.maestroV2){
                maestroToolNames.push(tool.name);
            }
            return maestroToolNames;
        }, []);
    }

    ngAfterContentInit(): void {
        if(this.maestro.multiModelPath != ""){
            if(fs.existsSync(this.maestro.multiModelPath)){
                return;
            }
            else {
                console.error(`Unable to locate multi-model at: ${this.maestro.multiModelPath}.`);
            }
        }
        this.showInitialSetupBtns = true;
        this.editing = this.maestro.name == "";

        const availableTools = this.simulationNamesFromTools(this.config.tools);
        this.maestro.tool = availableTools.length > 0 ? availableTools[0] : "";
    }

    hasUniqueName(): boolean {
        return this.formGroup.parent.hasError('notUnique') && this.formGroup.parent.errors.notUnique === this.maestro.name;
    }

    async onBaseExperimentSet(){
        if (!fs.existsSync(this.baseExperimentPath)) {
            return;
        }
        const destinationPath =  this.config.projectPath;
        const mm_destinationName = Path.join(destinationPath, this.maestro.name + "_multiModel.json");
        const coe_destinationName = Path.join(destinationPath, this.maestro.name + "_simConf.json");
        const mm_sourcePath = Path.join(this.baseExperimentPath, "..");
        const coe_sourcePath = this.baseExperimentPath;

        // Make a copy of the multi model and coe file so that changes can be reflected in these.
        await fs.promises.readdir(mm_sourcePath).then(async files => {
            const mm_name = files.find(fileName => fileName.toLowerCase().endsWith("mm.json"));
            if (mm_name) {
                const mm_sourceName = Path.join(mm_sourcePath, mm_name);
                await fs.promises.copyFile(mm_sourceName, mm_destinationName)
                .then(() => this.maestro.multiModelPath = mm_destinationName)
                .catch(err => console.warn(`Unable to copy multi model from: ${mm_sourceName} to ${mm_destinationName}: "${err}"`))
            }
            else {
                console.warn(`Unable to locate multi model in: ${mm_sourcePath}.`);
            }
        })
        await fs.promises.readdir(coe_sourcePath).then(async files =>{
            const coe_name = files.find(fileName => fileName.toLowerCase().endsWith("coe.json"));
            if (coe_name) {
                const coe_sourceName = Path.join(coe_sourcePath, coe_name);
                await fs.promises.copyFile(coe_sourceName, coe_destinationName)
                .then(() => this.maestro.coePath = coe_destinationName)
                .catch(err => console.warn(`Unable to copy coe file from: ${coe_sourceName} to ${coe_destinationName}: "${err}"`));
            }
            else {
                console.warn(`Unable to locate coe file in: ${coe_sourcePath}.`);
            }
        }) 

        this.showExperimentSelect = false;
    }

    doInitialSetup(setupFromExperiment: boolean) {
        this.showInitialSetupBtns = false;
        this.showExperimentSelect = setupFromExperiment;
        if(!setupFromExperiment){
            this.maestro.multiModelPath = Path.join(Path.dirname(this.config.projectPath), this.maestro.name + "_multiModel.json");
            fs.writeFileSync(this.maestro.multiModelPath, "{}", 'utf-8');
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

