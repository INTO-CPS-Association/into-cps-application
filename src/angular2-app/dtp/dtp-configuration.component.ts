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

import { Component, Input, EventEmitter, Output, NgZone } from "@angular/core";
import { Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import IntoCpsApp from "../../IntoCpsApp";
import { MaestroDtpType, DTPConfig, ServerDtpType, SignalDtpType, DataRepeaterDtpType } from "../../intocps-configurations/dtp-configuration";
import { VariableStepConstraint } from "../../intocps-configurations/CoSimulationConfig";
import { NavigationService } from "../shared/navigation.service";
import {
    numberValidator, integerValidator, lengthValidator,
    uniqueGroupPropertyValidator, uniqueValidator
} from "../../angular2-app/shared/validators";

const dialog = require("electron").remote.dialog;

@Component({
    selector: "dtp-configuration",
    templateUrl: "./angular2-app/dtp/dtp-configuration.component.html"
})
export class DtpConfigurationComponent {
    private _path: string;

    newConfig: new (...args: any[]) => VariableStepConstraint;

    @Input()
    set path(path: string) {
        console.log("Path was set");
        this._path = path;

        if (path)
            this.parseConfig();
    }

    //@Output()
    //change = new EventEmitter<string>();

    get path(): string {
        return this._path;
    }
    form: FormGroup;
    dtpTypes: VariableStepConstraint[] = [];
    editing: boolean = false;
    isLoaded: boolean = false;
    parseError: string = null;

    private config: DTPConfig;
    private dtpTypeConstructors = [MaestroDtpType, ServerDtpType, SignalDtpType, DataRepeaterDtpType]

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        console.log("HURRAY");
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        DTPConfig.parse(this.path, project.getRootFilePath()).then(config => {
            this.config = config;
            this.isLoaded = true;
            // Create a form group for each DTPType
            this.form = new FormGroup({dtpTypes: new FormArray(this.config.dtpTypes.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"))});
            console.log("Parsing finished!");

        },error => this.zone.run(() => { this.parseError = error })).catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;
        else {
            if (confirm("Save your work before leaving?"))
                this.onSubmit();

            return true;
        }
    }

    getDtpTypeName(dtpType: any) {
        if (dtpType === MaestroDtpType || dtpType instanceof MaestroDtpType) {
            return "Maestro"
        }
        else if (dtpType === ServerDtpType || dtpType instanceof ServerDtpType) {
            return "Server"
        }
        else if (dtpType === SignalDtpType || dtpType instanceof SignalDtpType){
            return "Signal"
        }
        else if (dtpType === DataRepeaterDtpType || dtpType instanceof DataRepeaterDtpType){
            return "Data-Repeater"
        }
        else {
            console.log("Unknown DTPType");
            if(this.newConfig){
                console.log("newconfig: " + this.newConfig);
            }
        }
    }

    addDtpType() {
        if (!this.newConfig) return;
        let dtpType = new this.newConfig();
        this.config.dtpTypes.push(dtpType);
        let formArray = <FormArray>this.form.get('dtpTypes');
        formArray.push(dtpType.toFormGroup());
    }

    removeDtpType(dtpType: VariableStepConstraint){
        let formArray = <FormArray>this.form.get('dtpTypes');
        let index = this.config.dtpTypes.indexOf(dtpType);
        this.config.dtpTypes.splice(index, 1);
        formArray.removeAt(index);
    }

    export(){
        let tools: any;
        if(this.dtpTypes.includes)
        let obj: any = {tools: }}
    }

    onSubmit() {
        if (!this.editing) return;
            this.config.save()
                /*.then(() => this.change.emit(this.path))*/.catch(error => console.error("error when saving: " + error));
        this.editing = false;
    }
}
