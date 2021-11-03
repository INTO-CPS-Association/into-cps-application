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
import { DataRepeaterDtpType, DTPConfig, DtpTypes, IDtpItem, MaestroDtpItem, TaskConfigurationDtpItem } from "../../../intocps-configurations/dtp-configuration";
import * as fs from "fs";

@Component({
    selector: 'task-configuration',
    templateUrl: "./angular2-app/dtp/inputs/taskConfiguration.component.html"
})
export class DtpTaskConfigurationComponent implements AfterContentInit {
    private taskConstructors = [DataRepeaterDtpType, MaestroDtpItem];
    dtpTypesEnum = DtpTypes;
    
    newTask: new (...args: any[]) => IDtpItem;

    @Input()
    configuration: TaskConfigurationDtpItem

    @Input()
    formGroup: FormGroup;

    @Input()
    config: DTPConfig;
    
    @Input()
    editing: boolean = true;

    constructor() {
        console.log("Configuration component constructor");
    }

    ngAfterContentInit(): void {
        this.editing = this.configuration.name == "";
    }

    onSaveTask(entry: any) {
        if (!entry.value) return;
        entry.value = false;
        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    taskFilter = (idtpType:IDtpItem) => { return idtpType.type == DtpTypes.DataRepeater || idtpType.type == DtpTypes.Maestro}

    getTaskName(dtpType: any): string {
        if (dtpType === MaestroDtpItem || dtpType instanceof MaestroDtpItem) {
            return "Maestro"
        } else if (dtpType === DataRepeaterDtpType || dtpType instanceof DataRepeaterDtpType) {
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
        if (task.type == DtpTypes.Maestro) {
            const maestroType = task as MaestroDtpItem;
            fs.unlink(maestroType.multiModelPath, err => { if (err) console.error(`Unable to delete multimodel file for ${maestroType.name}: ${err}`) });
        }
        const index = this.configuration.tasks.indexOf(task);
        this.configuration.tasks.splice(index, 1);
        (this.formGroup.get("tasks") as FormArray).removeAt(index);
        this.config.save().catch(error => console.error("error when saving: " + error));
    }
}