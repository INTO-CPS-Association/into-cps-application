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

import { Component, Input, OnDestroy, AfterContentInit } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { DataRepeaterDtpType, DTPConfig, IDtpItem, SignalDtpType, TaskConfigurationDtpItem, ToolDtpItem, ToolTypes } from "../../../intocps-configurations/dtp-configuration";
import { Subscription } from "rxjs";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";
import * as Path from 'path';

@Component({
    selector: 'data-repeater',
    templateUrl: "./angular2-app/dtp/inputs/datarepeater.component.html"
})
export class DtpDataRepeaterComponent implements OnDestroy, AfterContentInit {
    public static signalFormIndex = "signals";
    private isToolingServerOnlineSub: Subscription;
    private isToolingServerOnline: boolean = false;
    private _editing: boolean = true;

    @Input()
    datarepeater: DataRepeaterDtpType

    @Input()
    formGroup: FormGroup;
    
    @Input()
    set editing(editing: boolean) {
        this._editing = editing;
    }

    get editing(): boolean {
        return this.datarepeater.fmu_path == "" && this._editing;
    }

    @Input()
    config: DTPConfig;

    selectedSignal: string;

    showSelectGroup: boolean = true;

    isEditable: boolean = true;

    constructor(private dtpToolingService: DtpDtToolingService) {
        console.log("DataRepeater component constructor");
        this.isToolingServerOnlineSub = dtpToolingService.isOnlineObservable.subscribe(isOnline => {
            if (this.isToolingServerOnline != isOnline) {
                this.isToolingServerOnline = isOnline
            }
        });
    }

    ngAfterContentInit(): void {
        const availableTools = this.rabbitMqNamesFromTools(this.config.tools);
        this.datarepeater.tool = availableTools.length > 0 ? availableTools[0] : "";
    }

    onSaveSignal(entry: any) {
        if (!entry.value) return;
        entry.value = false;
        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    ngOnDestroy() {
        this.isToolingServerOnlineSub.unsubscribe();
    }

    getAvailableServersNames(servers: IDtpItem[]): string[] {
        return servers.reduce((serverNames: string[], server: IDtpItem) => {
            if(this.datarepeater.server_source != server.name && this.datarepeater.server_target != server.name){
                serverNames.push(server.name);
            }
            return serverNames;
        }, []);
    }

    rabbitMqNamesFromTools(tools: IDtpItem[]): string[] {
        return tools.reduce((rabbitMqToolNames: string[], tool: ToolDtpItem) => {
            if(tool.toolType == ToolTypes.rabbitmq){
                rabbitMqToolNames.push(tool.name);
            }
            return rabbitMqToolNames;
        }, []);
    }

    createFMU() {
        let dataRepeaterIndex: number;
        const parentConfiguration: TaskConfigurationDtpItem = this.config.configurations.find((configuration: TaskConfigurationDtpItem) => {
            const index = configuration.tasks.findIndex((task: IDtpItem) => task.name == this.datarepeater.name);
            if(index > -1){
                dataRepeaterIndex = index;
                return true;
            }
            return false;
        }) as TaskConfigurationDtpItem;

        parentConfiguration.toYaml().then(yamlObj => {
            const confObjArr: any[] = [];
            confObjArr.push(yamlObj);
            const parentConfigurationIndex = this.config.configurations.indexOf(parentConfiguration);
            this.dtpToolingService.addConfigurationToProject(confObjArr, this.config.projectName).then(() => {
                this.dtpToolingService.createFmuFromDataRepeater(parentConfigurationIndex.toString(), dataRepeaterIndex.toString(), this.config.projectName).then(relativeFmuPath => {
                    this.datarepeater.fmu_path = Path.join(this.dtpToolingService.projectPath, relativeFmuPath);
                }, err => console.log(err));
            });
        });
    }

    addNewSignal() {
        const signal = new SignalDtpType("");
        this.datarepeater.signals.push(signal);
        (this.formGroup.get("signals") as FormArray).push(signal.toFormGroup());
    }

    removeSignal(signal: IDtpItem) {
        const index = this.datarepeater.signals.indexOf(signal);
        this.datarepeater.signals.splice(index, 1);
        (this.formGroup.get("signals") as FormArray).removeAt(index);
        this.config.save().catch(error => console.error("error when saving: " + error));
    }
}

