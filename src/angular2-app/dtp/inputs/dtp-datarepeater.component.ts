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
import {
    DataRepeaterDtpItem,
    DTPConfig,
    dtpItem,
    SignalDtpType,
    TaskConfigurationDtpItem,
    ToolDtpItem,
    ToolType,
} from "../dtp-configuration";
import { Subscription } from "rxjs";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";
import * as Path from "path";
import IntoCpsApp from "../../../IntoCpsApp";

@Component({
    selector: "dtp-datarepeater",
    templateUrl: "./angular2-app/dtp/inputs/dtp-datarepeater.component.html",
})
export class DtpDataRepeaterComponent implements OnDestroy, AfterContentInit {
    public static signalFormIndex = "signals";
    private isToolingServerOnlineSub: Subscription;
    private isToolingServerOnline: boolean = false;
    private _editing: boolean = true;
    protected isCreatingFMU: boolean = false;

    @Input()
    datarepeater: DataRepeaterDtpItem;

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
        this.isToolingServerOnlineSub = dtpToolingService.isOnlineObservable.subscribe((isOnline) => {
            if (this.isToolingServerOnline != isOnline) {
                this.isToolingServerOnline = isOnline;
            }
        });
    }

    ngAfterContentInit(): void {
        if (!this.datarepeater.isCreatedOnServer) {
            const availableTools = this.getRabbitMqTools();
            this.datarepeater.tool = availableTools.length > 0 ? availableTools[0].id : "";
        }
    }

    ngOnDestroy() {
        this.isToolingServerOnlineSub.unsubscribe();
    }

    toolIdToName(toolId: string): string {
        return this.getRabbitMqTools().find((tool) => tool.id == toolId)?.name ?? "";
    }

    serverIdToName(serverId: string): string {
        return this.config.servers.find((server) => server.id == serverId)?.name ?? "";
    }

    getRabbitMqTools(): ToolDtpItem[] {
        return this.config.tools.reduce((rabbitMqToolNames: ToolDtpItem[], tool: ToolDtpItem) => {
            if (tool.type == ToolType.rabbitmq) {
                rabbitMqToolNames.push(tool);
            }
            return rabbitMqToolNames;
        }, []);
    }

    onChangeName(name: string) {
        this.datarepeater.name = name;
    }

    onChangeServerSource(id: string) {
        this.datarepeater.server_source = id.split(" ")[1];
    }

    onChangeServerTarget(id: string) {
        this.datarepeater.server_target = id.split(" ")[1];
    }

    onChangeTool(id: string) {
        this.datarepeater.tool = id.split(" ")[1];
    }

    generateFMU() {
        this.isCreatingFMU = true;
        const parentConfiguration: TaskConfigurationDtpItem = this.config.configurations.find(
            (configuration: TaskConfigurationDtpItem) =>
                configuration.tasks.findIndex((task: dtpItem) => task.id == this.datarepeater.id) > -1
        ) as TaskConfigurationDtpItem;

        parentConfiguration.toYamlObject().then(async (yamlObj) => {
            // Create or update the configuration in the server
            await (parentConfiguration.isCreatedOnServer
                ? this.dtpToolingService.updateConfiguration(parentConfiguration.id, yamlObj, this.config.projectName)
                : this.dtpToolingService
                      .addConfiguration(yamlObj, this.config.projectName)
                      .then(() => (parentConfiguration.isCreatedOnServer = true))
            ).finally(() => (this.datarepeater.isCreatedOnServer = true));

            // When the configuraiton is up-to-date in the server, create the datareapter FMU
            this.dtpToolingService
                .createFmuFromDataRepeater(parentConfiguration.id, this.datarepeater.id, this.config.projectName)
                .then((relativeFmuPath) => {
                    this.datarepeater.fmu_path = Path.resolve(
                        IntoCpsApp.getInstance().activeProject.getRootFilePath(),
                        "DTP",
                        relativeFmuPath
                    );
                    this.datarepeater.addLinkToFMU(this.config.fileLinksPath);
                })
                .catch((err) => console.log(err))
                .finally(() => (this.isCreatingFMU = false));
        });
    }

    addNewSignal() {
        const signal = new SignalDtpType("");
        this.datarepeater.signals.push(signal);
        (this.formGroup.get("signals") as FormArray).push(signal.toFormGroup());
    }

    removeSignal(signal: dtpItem) {
        const index = this.datarepeater.signals.indexOf(signal);
        this.datarepeater.signals.splice(index, 1);
        (this.formGroup.get("signals") as FormArray).removeAt(index);
    }
}
