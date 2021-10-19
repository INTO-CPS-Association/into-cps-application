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
import { Subject } from "rxjs/internal/Subject";
import * as fs from "fs";
import * as Path from 'path';
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";


const dialog = require("electron").remote.dialog;
const Yaml = require('js-yaml');
const Ajv = require("ajv")

@Component({
    selector: "dtp-configuration",
    templateUrl: "./angular2-app/dtp/dtp-configuration.component.html"
})
export class DtpConfigurationComponent {
    private _path: string;

    newConfig: new (...args: any[]) => IDtpType;

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
        console.log("HURRAY");
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        DTPConfig.parse(this.path, project.getRootFilePath()).then(config => {
            this.config = config;
            this.isLoaded = true;
            // Create a form group for each DTPType
            this.form = new FormGroup({ tasks: new FormArray(this.config.tasks.map(c => c.toFormGroup())), servers: new FormArray(this.config.servers.map(c => c.toFormGroup())), tools: new FormArray(this.config.tools.map(c => c.toFormGroup())), configurations: new FormArray(this.config.configurations.map(c => c.toFormGroup())) });
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
            if (this.newConfig) {
                console.log("newconfig: " + this.newConfig);
            }
        }
    }

    addServer() {
        const server = new ServerDtpType("new id");
        this.config.servers.push(server);
        let formArray = <FormArray>this.form.get('servers');
        formArray.push(server.toFormGroup());
        this.config.emitConfigChanged();
    }

    removeServer(server: IDtpType) {
        let formArray = <FormArray>this.form.get('servers');
        let index = this.config.servers.indexOf(server);
        this.config.servers.splice(index, 1);
        formArray.removeAt(index);
        this.config.emitConfigChanged();
    }

    addConfiguration() {
        const configuration = new TaskConfigurationDtpType();
        this.config.configurations.push(configuration);
        let formArray = <FormArray>this.form.get('configurations');
        formArray.push(configuration.toFormGroup());
        this.config.emitConfigChanged();
    }

    removeConfiguration(configuration: IDtpType) {
        let formArray = <FormArray>this.form.get('configurations');
        let index = this.config.configurations.indexOf(configuration);
        this.config.configurations.splice(index, 1);
        formArray.removeAt(index);
        this.config.emitConfigChanged();
    }

    addTask() {
        if (!this.newTask) return;
        let task = new this.newTask();
        this.config.tasks.push(task);
        let formArray = <FormArray>this.form.get('tasks');
        formArray.push(task.toFormGroup());
        this.config.emitConfigChanged();
    }

    removeTask(task: IDtpType) {
        let formArray = <FormArray>this.form.get('tasks');
        let index = this.config.tasks.indexOf(task);
        this.config.tasks.splice(index, 1);
        formArray.removeAt(index);
        this.config.emitConfigChanged();
    }

    addDtpType() {
        if (!this.newConfig) return;
        let dtpType = new this.newConfig();
        this.config.dtpTypes.push(dtpType);
        let formArray = <FormArray>this.form.get('dtpTypes');
        formArray.push(dtpType.toFormGroup());
        this.config.emitConfigChanged();
    }

    removeDtpType(dtpType: IDtpType) {
        if(dtpType.type == DtpTypes.MaestroDtpType){
            const maestroType = dtpType as MaestroDtpType;
            fs.unlink(maestroType.multiModelPath, err => {if (err) console.error(`Unable to delete multimodel file for ${maestroType.name}: ${err}`)});
        }
        let formArray = <FormArray>this.form.get('dtpTypes');
        let index = this.config.dtpTypes.indexOf(dtpType);
        this.config.dtpTypes.splice(index, 1);
        formArray.removeAt(index);
        this.config.emitConfigChanged();
    }

    async export() {
        // Format object structure to match yaml schema.
        const serverObjs: any[] = [];
        const configurationObjs: any[] = [];
        const toolObj: any = {};
        Promise.all(this.config.dtpTypes.map(async idtptype => {
            switch (idtptype.type) {
                case DtpTypes.ToolDtpType:
                    const tool = idtptype as ToolDtpType;
                    toolObj[tool.toolType] = { path: tool.path };
                    break;
                case DtpTypes.ServerDtpType:
                    const server = idtptype as ServerDtpType;
                    serverObjs.push({ id: server.id, name: server.name, user: server.username, password: server.password, host: server.host, port: server.port, type: server.servertype, embedded: server.embedded })
                    break;
                case DtpTypes.ConfigurationDtpType:
                    const configuration = idtptype as TaskConfigurationDtpType;
                    await Promise.all(configuration.tasks.map(async task => {
                        if (task.type == DtpTypes.DataRepeaterDtpType) {
                            const dataRepeater: DataRepeaterDtpType = task as DataRepeaterDtpType;
                            const signalsObj: any = {};
                            dataRepeater.signals.forEach(signal => {
                                const dtpSignal = signal as SignalDtpType;
                                signalsObj[dtpSignal.name] = { source: dtpSignal.source.toObject(), target: dtpSignal.target.toObject() };
                            });
                            let dataRepeaterObj: any = {};
                            dataRepeaterObj[dataRepeater.dtexport_type] = { name: dataRepeater.name, tool: dataRepeater.dtexport_implementation, servers: { source: dataRepeater.server_source, target: dataRepeater.server_target }, signals: signalsObj };
                            return dataRepeaterObj;
                        } else if (task.type == DtpTypes.MaestroDtpType) {
                            const maestro: MaestroDtpType = task as MaestroDtpType;
                            let project = IntoCpsApp.getInstance().getActiveProject();
                            const mmPath = Path.join(maestro.multiModelPath, "..", "mm.json");
                            var maestroObj;
                            await MultiModelConfig.parse(mmPath, project.getFmusPath()).then((multiModel: MultiModelConfig) => {
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
            const schemaPath = Path.join(Path.dirname(this._path), "schema.yml");
            const schemaObj = Yaml.load(fs.readFileSync(schemaPath, 'utf8'), {json: true});

            const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

            const validate = ajv.compile(schemaObj)

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
