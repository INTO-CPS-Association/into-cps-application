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
import { FormGroup } from "@angular/forms";
import { DataRepeaterDtpType, DTPConfig, DtpTypes, IDtpItem, SignalDtpType, TaskConfigurationDtpType, ToolDtpType, ToolTypes } from "../../../intocps-configurations/dtp-configuration";
import { Subscription } from "rxjs";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";
import * as Path from 'path';
import * as fs from "fs";

@Component({
    selector: 'data-repeater',
    templateUrl: "./angular2-app/dtp/inputs/datarepeater.component.html"
})
export class DtpDataRepeaterComponent implements AfterContentInit, OnDestroy {
    private typeRemovedSub: Subscription;
    private typeAddedSub: Subscription;
    private isToolingServerOnlineSub: Subscription;
    private isToolingServerOnline: boolean = false;

    @Input()
    dtptype: DataRepeaterDtpType

    @Input()
    formGroup: FormGroup;

    @Input()
    editing: boolean = false;

    @Input()
    config: DTPConfig;

    selectedSignal: string;

    showSelectGroup: boolean = true;

    constructor(private dtpToolingService: DtpDtToolingService) {
        console.log("DataRepeater component constructor");
        this.isToolingServerOnlineSub = dtpToolingService.isOnlineObservable.subscribe(isOnline => {
            if (this.isToolingServerOnline != isOnline) {
                this.isToolingServerOnline = isOnline
            }
        });
    }

    ngAfterContentInit(): void {
        this.typeRemovedSub = this.config.typeRemoved.asObservable().subscribe(type => {
            if (type.type == DtpTypes.Signal) {
                this.removeSignal(type);
            }
        });
        this.typeAddedSub = this.config.typeAdded.asObservable().subscribe(type => {
            if (type.type == DtpTypes.Signal) {
                this.updateSelectedSignal();
            }
        });
        this.updateSelectedSignal();
    }

    ngOnDestroy() {
        this.typeRemovedSub.unsubscribe();
        this.typeAddedSub.unsubscribe();
        this.isToolingServerOnlineSub.unsubscribe();
    }

    updateSelectedSignal() {
        this.selectedSignal = this.getRemaningSignalsNames()[0] ?? "";
        this.showSelectGroup = this.selectedSignal != "";
    }

    getRemaningSignalsNames(): string[] {
        const signals = this.config.tasks.reduce((signals: string[], idtpType) => {
            if (!this.dtptype.signals.includes(idtpType) && idtpType.type == DtpTypes.Signal) {
                signals.push(idtpType.name);
            }
            return signals;
        }, []);
        return signals.sort();
    }

    createFMU() {
        // const toolPath = (this.config.tools.find(t => (t as ToolDtpType).toolType == ToolTypes.rabbitmq) as ToolDtpType)?.path;
        // this.dtpToolingService.createFmuFromDataRepeater(this.dtptype.toYaml(), toolPath).then(res => {
        //     this.dtptype.fmu_path = res;
        // }).catch(err => console.log(err));

        // this.config.toYaml().then(yamlObj => {
        //     const configurations = this.config.configurations;
        //     const tempProject = "temp";
        //     const tempDir = Path.join(this.dtpToolingService.projectBasePath, tempProject);
        //     this.dtpToolingService.createProjectWithConfig(yamlObj, tempProject).then(() => {
        //         for (let i = 0; i < configurations.length; i++) {
        //             const configuration: TaskConfigurationDtpType = configurations[i] as TaskConfigurationDtpType;
        //             for (let l = 0; l < configuration.tasks.length; l++) {
        //                 if (configuration.tasks[l].type == DtpTypes.DataRepeater && configuration.tasks[l].name == this.dtptype.name) {
        //                     this.dtpToolingService.createFmuFromDataRepeaterIndex(`configurations/${i}/tasks/${l}`, tempProject).then(res => {
        //                         this.dtptype.fmu_path = res.file
        //                         const tempFmuPath = Path.join(this.dtpToolingService.projectBasePath, this.dtptype.fmu_path);
        //                         const targetDirPath = Path.join(this.dtpToolingService.projectBasePath, this.config.name);
        //                         fs.mkdirSync(targetDirPath, { recursive: true });
        //                         const targetFmuPath = Path.join(targetDirPath, `${this.dtptype.name}.fmu`);

        //                         fs.promises.copyFile(tempFmuPath, targetFmuPath).then(() => {
        //                             this.dtptype.fmu_path = targetFmuPath;
        //                             //this.dtpToolingService.deleteProject(tempProject);
        //                             fs.rmdirSync(tempDir, { recursive: true });
        //                         }).catch(err => console.log(err));
        //                     }, err => console.log(err));

        //                     l = configuration.tasks.length;
        //                     i = configurations.length;
        //                 }
        //             }
        //         }
        //     }).catch(err => console.warn(err));
        // }).catch(err => console.warn(err));
    }

    addSignal() {
        const signal = this.config.tasks.find(type => type.type == DtpTypes.Signal && type.name == this.selectedSignal);
        this.dtptype.signals.push(signal);
        this.updateSelectedSignal();
    }

    removeSignal(signal: IDtpItem) {
        const index = this.dtptype.signals.indexOf(signal, 0);
        if (index > -1) {
            this.dtptype.signals.splice(index, 1);
        }
        this.updateSelectedSignal();
    }
}

