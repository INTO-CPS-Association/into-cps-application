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

import { Component, Input } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { MaestroDtpItem, DTPConfig, ServerDtpItem, SignalDtpType, DataRepeaterDtpItem, IDtpItem, ToolDtpItem, TaskConfigurationDtpItem, ToolTypes } from "../../intocps-configurations/dtp-configuration";
import { NavigationService } from "../shared/navigation.service";
import { uniqueGroupPropertyValidator } from "../../angular2-app/shared/validators";
import { DtpDtToolingService } from "./dtp-dt-tooling.service";

const Yaml = require('js-yaml');
const Ajv = require("ajv")

@Component({
    selector: "dtp-configuration",
    templateUrl: "./angular2-app/dtp/dtp-configuration.component.html"
})
export class DtpConfigurationComponent {
    private _path: string;
    private readonly formkey_servers = "servers";
    private readonly formkey_configurations = "configurations";
    private readonly formkey_tools = "tools";
    private _config: DTPConfig;
    private dtpTypeConstructors = [MaestroDtpItem, ServerDtpItem, SignalDtpType, DataRepeaterDtpItem, ToolDtpItem, TaskConfigurationDtpItem];

    @Input()
    set config(config: DTPConfig) {
        this._config = config;
        this.handleConfigurationUpdated();
    }
    get config(): DTPConfig {
        return this._config;
    }

    form: FormGroup;
    isLoaded: boolean = false;
    parseError: string = null;
    isConfigValid: boolean = false;

    constructor(private navigationService: NavigationService, private dtpToolingService: DtpDtToolingService) {
        this.navigationService.registerComponent(this);
    }

    private handleConfigurationUpdated(){
        const groupObj: any = {};
        groupObj[this.formkey_servers] = new FormArray(this.config.servers.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"));
        groupObj[this.formkey_tools] = new FormArray(this.config.tools.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"));
        groupObj[this.formkey_configurations] = new FormArray(this.config.configurations.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));

        this.form = new FormGroup(groupObj);
        this.isLoaded = true;
    }

    onNavigate(): boolean {
        return true;
    }

    getDtpTypeName(dtpType: any): string {
        if (dtpType === ServerDtpItem || dtpType instanceof ServerDtpItem) {
            return "Server"
        } else if (dtpType === ToolDtpItem || dtpType instanceof ToolDtpItem) {
            return "Tool"
        } else if (dtpType === TaskConfigurationDtpItem || dtpType instanceof TaskConfigurationDtpItem) {
            return "Configuration"
        } else {
            console.log("Unknown DTPType");
        }
    }

    addDtpItem(typeName: string) {
        let item;
        let formArray;
        if (typeName == "server") {
            item = new ServerDtpItem("");
            this.config.servers.push(item);
            formArray = <FormArray>this.form.get(this.formkey_servers);
        }
        else if (typeName == "configuration") {
            item = new TaskConfigurationDtpItem();
            this.config.configurations.push(item);
            formArray = <FormArray>this.form.get(this.formkey_configurations);
        }
        else if (typeName == "tool") {
            item = new ToolDtpItem("", "", "", ToolTypes.maestro);
            this.config.tools.push(item);
            formArray = <FormArray>this.form.get(this.formkey_tools);
        }
        else {
            console.log("Unknown DTPType");
            return;
        }
        formArray.push(item.toFormGroup());
    }

    removeDtpItem(item: IDtpItem) {
        let formArray: FormArray;
        let index;
        if (item instanceof ServerDtpItem) {
            formArray = <FormArray>this.form.get(this.formkey_servers);
            index = this.config.servers.indexOf(item);
            this.config.servers.splice(index, 1);
            this.dtpToolingService.removeServerInProject(item.id, this.config.projectName);
        } else if (item instanceof TaskConfigurationDtpItem) {
            formArray = <FormArray>this.form.get(this.formkey_configurations);
            index = this.config.configurations.indexOf(item);
            this.config.configurations.splice(index, 1);
            this.dtpToolingService.removeConfigurationInProject(item.id, this.config.projectName);
        } else if (item instanceof ToolDtpItem) {
            formArray = <FormArray>this.form.get(this.formkey_tools);
            index = this.config.tools.indexOf(item);
            this.config.tools.splice(index, 1);
            this.dtpToolingService.removeToolInProject(item.id, this.config.projectName);
        } else {
            console.log("Unknown DTPType");
            return;
        }
        formArray.removeAt(index);
    }

    validateConfig() {
        // this.config.toYaml().then(yamlObj => {
        //     const schemaPath = Path.join(Path.dirname(this._path), "..", "schema.yml");
        //     const schemaObj = Yaml.load(fs.readFileSync(schemaPath, 'utf8'), { json: true });
    
        //     const validate = new Ajv().compile(schemaObj)
        //     this.isConfigValid = validate(yamlObj);
        //     if (!this.isConfigValid) {
        //         console.warn("YAML config has errors: " + validate.errors);
        //     }
        // });
    }
}
