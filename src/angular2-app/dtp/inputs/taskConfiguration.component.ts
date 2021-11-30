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
import { FormArray, FormGroup } from "@angular/forms";
import { DataRepeaterDtpItem, DTPConfig, DtpType, IDtpItem, MaestroDtpItem, TaskConfigurationDtpItem } from "../dtp-configuration";
import * as fs from "fs";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";

@Component({
    selector: 'task-configuration',
    templateUrl: "./angular2-app/dtp/inputs/taskConfiguration.component.html"
})
export class DtpTaskConfigurationComponent implements AfterContentInit {
    private taskConstructors = [DataRepeaterDtpItem, MaestroDtpItem];
    dtpTypesEnum = DtpType;
    
    newTask: new (...args: any[]) => IDtpItem;

    @Input()
    configuration: TaskConfigurationDtpItem

    @Input()
    formGroup: FormGroup;

    @Input()
    config: DTPConfig;
    
    editing: boolean = true;

    constructor(private dtpToolingService: DtpDtToolingService) {
        console.log("Configuration component constructor");

    }

    ngAfterContentInit(): void {
        this.editing = this.configuration.name == "";
    }

    isTaskMaestro = (task: IDtpItem) => task instanceof MaestroDtpItem;
    isTaskDatarepeater = (task: IDtpItem) => task instanceof DataRepeaterDtpItem;
    taskFilter = (item: IDtpItem) => { return this.isTaskMaestro(item) || this.isTaskDatarepeater(item)}

    getTaskName(dtpType: any): string {
        if (dtpType === MaestroDtpItem || dtpType instanceof MaestroDtpItem) {
            return "Maestro"
        } else if (dtpType === DataRepeaterDtpItem || dtpType instanceof DataRepeaterDtpItem) {
            return "Data-Repeater"
        } else {
            console.log("Unknown task type");
        }
    }

    addNewTask() {
        if (!this.newTask) return;
        const task = new this.newTask();
        this.configuration.tasks.push(task);
        (this.formGroup.get("tasks") as FormArray).push(task.toFormGroup());
    }

    removeTask(task: IDtpItem) {
        this.dtpToolingService.removeTaskFromConfiguration(this.configuration.name, task.name, this.config.projectName).then(() => {
            this.config.removeMappingPath(task, true);
            const index = this.configuration.tasks.indexOf(task);
            this.configuration.tasks.splice(index, 1);
            (this.formGroup.get("tasks") as FormArray).removeAt(index);
        }).catch(err => console.error("Unable to remove task from configuration: " + err));
    }

    onSaveConfiguration() {
        this.editing = false;
        this.configuration.toYamlObject().then(async confYamlObj => {
            // Create or update the task configuration in the server
            this.configuration.isCreatedOnServer ? await this.dtpToolingService.updateConfiguration(this.configuration.name, confYamlObj, this.config.projectName) : 
                await this.dtpToolingService.addConfiguration(confYamlObj, this.config.projectName).then(() => this.configuration.isCreatedOnServer = true);
        }).then(() => this.configuration.tasks.forEach(task => {
            // Add mapping for tasks. e.g.: maestro task item maps to the path of the (copied) multi-model file and coe file.
            if(task instanceof MaestroDtpItem || task instanceof DataRepeaterDtpItem){
                this.config.addMappingPath(task);
            }
        }));
    }
}