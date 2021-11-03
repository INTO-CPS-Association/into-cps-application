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

import { Component, Input, NgZone, AfterContentInit } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { MaestroDtpItem, DTPConfig, ServerDtpItem, SignalDtpType, DataRepeaterDtpType, IDtpItem, DtpTypes, ToolDtpItem, TaskConfigurationDtpItem, ToolTypes } from "../../intocps-configurations/dtp-configuration";
import { NavigationService } from "../shared/navigation.service";
import { uniqueGroupPropertyValidator } from "../../angular2-app/shared/validators";
import * as fs from "fs";
import * as Path from 'path';
import { DtpDtToolingService } from "./dtp-dt-tooling.service";

const Yaml = require('js-yaml');
const Ajv = require("ajv")

@Component({
    selector: "dtp-configuration",
    templateUrl: "./angular2-app/dtp/dtp-configuration.component.html"
})
export class DtpConfigurationComponent implements AfterContentInit {
    private _path: string;
    private readonly formkey_servers = "servers";
    private readonly formkey_configurations = "configurations";
    private readonly formkey_tools = "tools";
    private config: DTPConfig;
    private dtpTypeConstructors = [MaestroDtpItem, ServerDtpItem, SignalDtpType, DataRepeaterDtpType, ToolDtpItem, TaskConfigurationDtpItem];

    @Input()
    set path(path: string) {
        console.log("Path was set");
        this._path = path;

        if (path)
            this.parseConfig();
    }

    get path(): string {
        return this._path;
    }
    form: FormGroup;
    isLoaded: boolean = false;
    parseError: string = null;
    isConfigValid: boolean = false;
    configurationsWithEditing = new Map<IDtpItem, Boolean>();
    serversWithEditing = new Map<IDtpItem, Boolean>();
    toolsWithEditing = new Map<IDtpItem, Boolean>();

    constructor(private zone: NgZone, private navigationService: NavigationService, private dtpToolingService: DtpDtToolingService) {
        this.navigationService.registerComponent(this);
    }

    ngAfterContentInit(): void {
        //this.dtpToolingService.startServer(Path.dirname(this._path));

        this.dtpToolingService.getProjects().then((projectNames: string[]) => {
            if(projectNames.findIndex(name => this.config.projectName == name) == -1){
                this.dtpToolingService.createProject(this.config.projectName);
            }
        });
    }

    private parseConfig() {
        DTPConfig.parse(this.path).then(config => {
            this.config = config;
            this.isLoaded = true;

            this.config.configurations.forEach(configuration => this.configurationsWithEditing.set(configuration, configuration.name == ""));
            this.config.servers.forEach(server => this.serversWithEditing.set(server, server.name == ""));
            this.config.tools.forEach(tool => this.toolsWithEditing.set(tool, tool.name == ""));

            // Create a form group for each DTPType
            const groupObj: any = {};
            groupObj[this.formkey_servers] = new FormArray(this.config.servers.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"));
            groupObj[this.formkey_tools] = new FormArray(this.config.tools.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));
            groupObj[this.formkey_configurations] = new FormArray(this.config.configurations.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));

            this.form = new FormGroup(groupObj);
            console.log("Parsing finished!");

        }, error => this.zone.run(() => { this.parseError = error })).catch(error => console.error(`Error during parsing of config: ${error}`));
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
        let type;
        let formArray;
        if (typeName == "server") {
            type = new ServerDtpItem("new id");
            this.config.servers.push(type);
            formArray = <FormArray>this.form.get(this.formkey_servers);
            this.toolsWithEditing.set(type, true);
        }
        else if (typeName == "configuration") {
            type = new TaskConfigurationDtpItem();
            this.config.configurations.push(type);
            formArray = <FormArray>this.form.get(this.formkey_configurations);
            this.configurationsWithEditing.set(type, true);
        }
        else if (typeName == "tool") {
            type = new ToolDtpItem("Tool", "", "", ToolTypes.maestro);
            this.config.tools.push(type);
            formArray = <FormArray>this.form.get(this.formkey_tools);
            this.toolsWithEditing.set(type, true);
        }
        else {
            console.log("Unknown DTPType");
            return;
        }
        formArray.push(type.toFormGroup());
        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    removeDtpItem(item: IDtpItem) {
        let formArray;
        let index;
        if (item.type == DtpTypes.Server) {
            formArray = <FormArray>this.form.get(this.formkey_servers);
            index = this.config.servers.indexOf(item);
            this.config.servers.splice(index, 1);
            this.serversWithEditing.delete(item);
        } else if (item.type == DtpTypes.Configuration) {
            formArray = <FormArray>this.form.get(this.formkey_configurations);
            index = this.config.configurations.indexOf(item);
            this.config.configurations.splice(index, 1);
            this.configurationsWithEditing.delete(item);
        } else if (item.type == DtpTypes.Tool) {
            formArray = <FormArray>this.form.get(this.formkey_tools);
            index = this.config.tools.indexOf(item);
            this.config.tools.splice(index, 1);
            this.toolsWithEditing.delete(item);
        } else {
            console.log("Unknown DTPType");
            return;
        }
        formArray.removeAt(index);
        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    onSaveDtpItem(entry: any) {
        if (!entry.value) return;
        entry.value = false;
        const dtpItem = entry.key;
        if(dtpItem instanceof ServerDtpItem){
            this.dtpToolingService.addServerToProject(dtpItem.name, (dtpItem as IDtpItem).toYaml(), this.config.projectName);
        } else if(dtpItem instanceof ToolDtpItem){
            this.dtpToolingService.addToolToProject(dtpItem.name, (dtpItem as IDtpItem).toYaml(), this.config.projectName);
        } else if(dtpItem instanceof TaskConfigurationDtpItem){
            (dtpItem as TaskConfigurationDtpItem).toYaml().then(configYamlObj => {
                const confObjArr: any[] = [];
                confObjArr.push(configYamlObj);
                this.dtpToolingService.addConfigurationToProject(confObjArr, this.config.projectName);
            })            
        }

        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    onEditDtpItem(entry: any) {
        if (entry.value) return;
        entry.value = true;
        const dtpItem = entry.key;
        if(dtpItem instanceof ServerDtpItem){
            this.dtpToolingService.removeServerInProject(dtpItem.name, this.config.projectName);
        } else if(dtpItem instanceof ToolDtpItem){
            this.dtpToolingService.removeToolInProject(dtpItem.name, this.config.projectName);
        } else if(dtpItem instanceof TaskConfigurationDtpItem){
            const index = this.config.configurations.indexOf(dtpItem).toString();
            this.dtpToolingService.removeConfigurationInProject(index, this.config.projectName);
        }

        this.config.save().catch(error => console.error("error when saving: " + error));
    }

    validateConfig() {
        this.config.toYaml().then(yamlObj => {
            const schemaPath = Path.join(Path.dirname(this._path), "..", "schema.yml");
            const schemaObj = Yaml.load(fs.readFileSync(schemaPath, 'utf8'), { json: true });
    
            const validate = new Ajv().compile(schemaObj)
            this.isConfigValid = validate(yamlObj);
            if (!this.isConfigValid) {
                console.warn("YAML config has errors: " + validate.errors);
            }
        });

        this.dtpToolingService.getProject(this.config.projectName).then(res => {
            const yamlObj = res;

            const i = 1;
        });



        //this.dtpToolingService.stopServer();
    }
}
