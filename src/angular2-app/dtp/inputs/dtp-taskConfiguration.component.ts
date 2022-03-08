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
import { DataRepeaterDtpItem, DTPConfig, DtpType, dtpItem, MaestroDtpItem, TaskConfigurationDtpItem } from "../dtp-configuration";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";

@Component({
    selector: "dtp-taskconfiguration",
    templateUrl: "./angular2-app/dtp/inputs/dtp-taskConfiguration.component.html",
})
export class DtpTaskConfigurationComponent implements AfterContentInit {
    private taskNameToConstructor: taskNameToConstructor[] = [
        { name: "Data-Repeater", constructor: DataRepeaterDtpItem },
        { name: "Maestro", constructor: MaestroDtpItem },
    ];
    protected dtpTypesEnum = DtpType;

    protected selectedTask: string = "Select task...";

    @Input()
    configuration: TaskConfigurationDtpItem;

    @Input()
    formGroup: FormGroup;

    @Input()
    config: DTPConfig;

    editing: boolean = true;

    constructor(private dtpToolingService: DtpDtToolingService) {}

    ngAfterContentInit(): void {
        this.editing = !this.configuration.isCreatedOnServer;
    }

    onChangeName(name: string) {
        this.configuration.name = name;
    }

    protected isTaskMaestro = (task: dtpItem) => task instanceof MaestroDtpItem;
    protected isTaskDatarepeater = (task: dtpItem) => task instanceof DataRepeaterDtpItem;

    protected getTaskName(task: any): string {
        const taskName: string = this.taskNameToConstructor.find((taskToCon) => taskToCon.constructor == task.constructor)?.name;
        if (taskName) {
            return taskName;
        } else {
            console.log(`Unknown task type ${task}`);
            return "";
        }
    }

    protected addSelectedTask() {
        const taskConstructor = this.taskNameToConstructor.find((task) => task.name == this.selectedTask)?.constructor;
        if (taskConstructor) {
            const task: dtpItem = new taskConstructor();
            this.configuration.tasks.push(task);
            (this.formGroup.get("tasks") as FormArray).push(task.toFormGroup());
        }
    }

    protected async removeTask(task: dtpItem) {
        if (task.isCreatedOnServer) {
            await this.dtpToolingService
                .removeTaskFromConfiguration(this.configuration.id, task.id, this.config.projectName)
                .catch((err) => {
                    console.error("Unable to remove task from configuration: " + err);
                    return;
                });
        }
        if (task instanceof MaestroDtpItem || task instanceof DataRepeaterDtpItem) {
            task.removeFileLink(this.config.fileLinksPath, true);
        }
        const index = this.configuration.tasks.indexOf(task);
        this.configuration.tasks.splice(index, 1);
        (this.formGroup.get("tasks") as FormArray).removeAt(index);
    }

    protected onSaveConfiguration() {
        this.configuration
            .toYamlObject()
            .then(async (confYamlObj) =>
                // Create or update the task configuration in the server
                this.configuration.isCreatedOnServer
                    ? await this.dtpToolingService.updateConfiguration(this.configuration.id, confYamlObj, this.config.projectName)
                    : await this.dtpToolingService
                          .addConfiguration(confYamlObj, this.config.projectName)
                          .then(() => (this.configuration.isCreatedOnServer = true))
            )
            .then(() => {
                this.configuration.tasks.forEach((task) => (task.isCreatedOnServer = true));
                this.editing = false;
            })
            .catch((err) => console.warn("Unable to save configuration: " + err));
    }
}

type taskNameToConstructor = {
    name: string;
    constructor: any;
};
