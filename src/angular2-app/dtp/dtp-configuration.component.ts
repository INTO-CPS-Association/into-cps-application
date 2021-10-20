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

import { Component, Input, NgZone } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import IntoCpsApp from "../../IntoCpsApp";
import { MaestroDtpType, DTPConfig, ServerDtpType, SignalDtpType, DataRepeaterDtpType, IDtpType, DtpTypes, ToolDtpType, TaskConfigurationDtpType, ToolTypes } from "../../intocps-configurations/dtp-configuration";
import { NavigationService } from "../shared/navigation.service";
import { uniqueGroupPropertyValidator } from "../../angular2-app/shared/validators";
import * as fs from "fs";
import * as Path from 'path';
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import { ThrowStmt } from "@angular/compiler";


const dialog = require("electron").remote.dialog;
const Yaml = require('js-yaml');
const Ajv = require("ajv")

@Component({
    selector: "dtp-configuration",
    templateUrl: "./angular2-app/dtp/dtp-configuration.component.html"
})
export class DtpConfigurationComponent {
    private _path: string;
    private readonly servers_key = "servers";
    private readonly configurations_key = "configurations";
    private readonly tools_key = "tools";
    private readonly tasks_key = "tasks";

    newTask: new (...args: any[]) => IDtpType;

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
    editing: boolean = false;
    isLoaded: boolean = false;
    parseError: string = null;
    dtpTypesEnum = DtpTypes;

    private config: DTPConfig;
    private dtpTypeConstructors = [MaestroDtpType, ServerDtpType, SignalDtpType, DataRepeaterDtpType, ToolDtpType, TaskConfigurationDtpType]
    private taskConstructors = [DataRepeaterDtpType, SignalDtpType, MaestroDtpType];

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        DTPConfig.parse(this.path, project.getRootFilePath()).then(config => {
            this.config = config;
            this.isLoaded = true;
            // Create a form group for each DTPType
            const groupObj: any = {};
            groupObj[this.tasks_key] = new FormArray(this.config.tasks.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));
            groupObj[this.servers_key] = new FormArray(this.config.servers.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"));
            groupObj[this.tools_key] = new FormArray(this.config.tools.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));
            groupObj[this.configurations_key] = new FormArray(this.config.configurations.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("name"));
            this.form = new FormGroup(groupObj);
            console.log("Parsing finished!");

        }, error => this.zone.run(() => { this.parseError = error })).catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;
        else {
            if (confirm("Save your work before leaving?")) {
                //this.onSubmit();
            }
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
        else if (dtpType === SignalDtpType || dtpType instanceof SignalDtpType) {
            return "Signal"
        }
        else if (dtpType === DataRepeaterDtpType || dtpType instanceof DataRepeaterDtpType) {
            return "Data-Repeater"
        }
        else if (dtpType === ToolDtpType || dtpType instanceof ToolDtpType) {
            return "Tool"
        }
        else if (dtpType === TaskConfigurationDtpType || dtpType instanceof TaskConfigurationDtpType) {
            return "Configuration"
        }
        else {
            console.log("Unknown DTPType");
        }
    }

    addNewDtpType(typeName: string) {
        let type;
        let formArray;
        if (typeName == "task") {
            if (!this.newTask) return;
            type = new this.newTask();
            this.config.tasks.push(type);
            formArray = <FormArray>this.form.get(this.tasks_key);
        }
        else if (typeName == "server") {
            type = new ServerDtpType("new id");
            this.config.servers.push(type);
            formArray = <FormArray>this.form.get(this.servers_key);
        }
        else if (typeName == "configuration") {
            type = new TaskConfigurationDtpType();
            this.config.configurations.push(type);
            formArray = <FormArray>this.form.get(this.configurations_key);
        }
        else if (typeName == "tool") {
            type = new ToolDtpType("Tool", "", ToolTypes.maestro);
            this.config.tools.push(type);
            formArray = <FormArray>this.form.get(this.tools_key);
        }
        else {
            console.log("Unknown DTPType");
            return;
        }

        formArray.push(type.toFormGroup());
        this.config.emitConfigChanged();
    }

    removeDtpDtype(type: IDtpType){
        let formArray;
        let index;
        if (type.type == DtpTypes.Signal || type.type == DtpTypes.DataRepeater || type.type == DtpTypes.Maestro) {
            if (type.type == DtpTypes.Maestro) {
                const maestroType = type as MaestroDtpType;
                fs.unlink(maestroType.multiModelPath, err => { if (err) console.error(`Unable to delete multimodel file for ${maestroType.name}: ${err}`) });
            }
            formArray = <FormArray>this.form.get(this.tasks_key);
            index = this.config.tasks.indexOf(type);
            this.config.tasks.splice(index, 1);
        }
        else if (type.type == DtpTypes.Server) {
            formArray = <FormArray>this.form.get(this.servers_key);
            index = this.config.servers.indexOf(type);
            this.config.servers.splice(index, 1);
        }
        else if (type.type == DtpTypes.Configuration) {
            formArray = <FormArray>this.form.get(this.configurations_key);
            index = this.config.configurations.indexOf(type);
            this.config.configurations.splice(index, 1);
        }
        else if (type.type == DtpTypes.Tool) {
            formArray = <FormArray>this.form.get(this.tools_key);
            index = this.config.tools.indexOf(type);
            this.config.tools.splice(index, 1);
        }
        else {
            console.log("Unknown DTPType");
            return;
        }

        formArray.removeAt(index);
        this.config.emitConfigChanged();
    }

    async export() {
        // Format object structure to match yaml schema.
        const serverObjs: any[] = [];
        const configurationObjs: any[] = [];
        const toolObj: any = {};
        Promise.all(this.config.configurations.concat(this.config.tools).concat(this.config.servers).map(async idtptype => {
            switch (idtptype.type) {
                case DtpTypes.Tool:
                    const tool = idtptype as ToolDtpType;
                    toolObj[tool.toolType] = { path: tool.path };
                    break;
                case DtpTypes.Server:
                    const server = idtptype as ServerDtpType;
                    serverObjs.push({ id: server.id, name: server.name, user: server.username, password: server.password, host: server.host, port: server.port, type: server.servertype, embedded: server.embedded })
                    break;
                case DtpTypes.Configuration:
                    const configuration = idtptype as TaskConfigurationDtpType;
                    await Promise.all(configuration.tasks.map(async task => {
                        if (task.type == DtpTypes.DataRepeater) {
                            const dataRepeater: DataRepeaterDtpType = task as DataRepeaterDtpType;
                            const signalsObj: any = {};
                            dataRepeater.signals.forEach(signal => {
                                const dtpSignal = signal as SignalDtpType;
                                signalsObj[dtpSignal.name] = { source: dtpSignal.source.toObject(), target: dtpSignal.target.toObject() };
                            });
                            let dataRepeaterObj: any = {};
                            dataRepeaterObj[dataRepeater.dtexport_type] = { name: dataRepeater.name, tool: dataRepeater.dtexport_implementation, servers: { source: dataRepeater.server_source, target: dataRepeater.server_target }, signals: signalsObj };
                            return dataRepeaterObj;
                        } else if (task.type == DtpTypes.Maestro) {
                            const maestro: MaestroDtpType = task as MaestroDtpType;
                            let project = IntoCpsApp.getInstance().getActiveProject();
                            var maestroObj;
                            await MultiModelConfig.parse(maestro.multiModelPath, project.getFmusPath()).then((multiModel: MultiModelConfig) => {
                                maestroObj = { simulation: { name: maestro.name, execution: { capture_output: maestro.capture_output }, tool: maestro.tool, version: maestro.version, config: multiModel.toObject() } };
                            }, err => {
                                console.error(`Error during parsing of config: ${err}`);
                            });
                            return maestroObj;
                        }
                    })).then(tasks => {
                        configurationObjs.push({ name: configuration.name, tasks: tasks });
                    });
                    break;
            }
        })).then(() => {
            const yamlObj = { version: "0.0.1", tools: toolObj, servers: serverObjs, configurations: configurationObjs };

            try {
                var yamlConfig = Yaml.dump(yamlObj);
            }
            catch (ex) {
                console.error(`Unable to generate yaml configuration: ${ex}`);
            }

            const configPath = Path.join(Path.dirname(this._path), "configuration.yml");
            fs.writeFile(configPath, yamlConfig, error => {
                if (error) {
                    console.error(`Unable to write yaml configuration to ${configPath}`);
                }
            });
            const schemaPath = Path.join(Path.dirname(this._path), "..", "schema.yml");
            const schemaObj = Yaml.load(fs.readFileSync(schemaPath, 'utf8'), { json: true });

            const validate = new Ajv().compile(schemaObj) // options can be passed, e.g. {allErrors: true}

            const valid = validate(yamlObj)
            if (!valid) console.log(validate.errors)
        });
    }

    onSubmit() {
        if (!this.editing) return;
        this.config.save()
                /*.then(() => this.change.emit(this.path))*/.catch(error => console.error("error when saving: " + error));
        this.editing = false;
    }
}
