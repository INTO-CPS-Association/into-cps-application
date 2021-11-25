import {
    integerValidator
} from "../angular2-app/shared/validators";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { IntoCpsApp } from "../IntoCpsApp";
import { MultiModelConfig } from "./MultiModelConfig";
import * as fs from "fs";
import * as Path from 'path';

export class DTPConfig {
    private static readonly toolsIndex = "tools";
    private static readonly  serversIndex = "servers";
    private static readonly  configurationsIndex = "configurations";
    private static readonly  mappingsFile = "PathMappings.json";
    private static readonly  mmMappingsIndex = "multiModelPathMappings";
    private static readonly  datarepeaterMappingsIndex = "dataRepeaterFmuMappings";
    private readonly mappingsFilePath: string;
    constructor(public configurations: Array<TaskConfigurationDtpItem> = [], public tools: Array<ToolDtpItem> = [], public servers: Array<ServerDtpItem> = [], public projectName: string = "", public projectPath: string = "", mappingsFilePath: string = "") {
        this.mappingsFilePath = mappingsFilePath;
    }

    public addMappingPath(item: IDtpItem) {
        const obj = JSON.parse(fs.readFileSync(this.mappingsFilePath, {encoding:'utf8', flag:'r'}));

        let mappingIndex: string = "";
        let key: string = "";
        let value: string = "";

        if(item instanceof MaestroDtpItem){
            mappingIndex = DTPConfig.mmMappingsIndex;
            key = item.name;
            value = item.multiModelPath;
        } else if(item instanceof DataRepeaterDtpItem){
            mappingIndex = DTPConfig.datarepeaterMappingsIndex;
            key = item.name;
            value = item.fmu_path;
        }

        if(!mappingIndex || !value) {
            return;
        }

        if(!obj[mappingIndex]){
            obj[mappingIndex] = {};
        }

        obj[mappingIndex][key] = value;

        fs.writeFile(this.mappingsFilePath, JSON.stringify(obj), err => console.warn(err));
    }

    public removeMappingPath(item: IDtpItem){
        const obj = JSON.parse(fs.readFileSync(this.mappingsFilePath, {encoding:'utf8', flag:'r'}));

        let mappingIndex: string = "";
        let key: string = "";

        if(item instanceof MaestroDtpItem){
            mappingIndex = DTPConfig.mmMappingsIndex;
            key = item.name;
        } else if(item instanceof DataRepeaterDtpItem){
            mappingIndex = DTPConfig.datarepeaterMappingsIndex;
            key = item.name;
        } else {
            return;
        }

        if(obj[mappingIndex][key]){
            delete obj[mappingIndex][key];
        } else {
            return;
        }
        
        fs.writeFile(this.mappingsFilePath, JSON.stringify(obj), err => console.warn(err));
    }

    public static createFromYamlConfig(yamlConfig: any, projectName: string, projectPath: string): DTPConfig {
        const tools = DTPConfig.toolsIndex in yamlConfig ?  Object.keys(yamlConfig[DTPConfig.toolsIndex]).map(toolId => {
            return ToolDtpItem.parse(yamlConfig[DTPConfig.toolsIndex][toolId], toolId);
        }) : [];

        const servers = DTPConfig.serversIndex in yamlConfig ? Object.keys(yamlConfig[DTPConfig.serversIndex]).map(serverId => {
            return ServerDtpItem.parse(yamlConfig[DTPConfig.serversIndex][serverId], serverId);
        }) : [];

        const mappingsFilePath = Path.join(projectPath, DTPConfig.mappingsFile);
        DTPConfig.ensureMappingFileExists(mappingsFilePath);
        let mappings: any;
        try {
            mappings = JSON.parse(fs.readFileSync(mappingsFilePath, {encoding:'utf8', flag:'r'}));
        } catch(ex) {
            mappings = {};
            console.warn("Unable to parse path mappings from file at path '" + mappingsFilePath + "' due to: " + ex);
        } finally {
            const configurations = DTPConfig.configurationsIndex in yamlConfig ? yamlConfig[DTPConfig.configurationsIndex].map((configuration: any) => {
                return TaskConfigurationDtpItem.parse(configuration, mappings[DTPConfig.mmMappingsIndex] ?? {}, mappings[DTPConfig.datarepeaterMappingsIndex] ?? {});
            }): [];
           
            return new DTPConfig(configurations, tools, servers, projectName, projectPath, mappingsFilePath);
        }
    }

    private static ensureMappingFileExists(path: string){
        if(!fs.existsSync(path)) {
            fs.writeFileSync(path, "{}");
        }
    }

    toYamlObject(version: string = "0.0.0"): any {
        const yamlObj: any = {};
        yamlObj.version = version;
        yamlObj[DTPConfig.toolsIndex] = this.tools;
        yamlObj[DTPConfig.serversIndex] = this.servers;
        yamlObj[DTPConfig.configurationsIndex] = this.configurations;
        return yamlObj;
    }
}

export interface IDtpItem {
    id: string;
    toFormGroup(): FormGroup;
    toYamlObject(): { };
}

export enum DtpTypes {
    Server = "Server",
    Maestro = "Maestro",
    Signal = "Signal",
    DataRepeater = "Data-repeater",
    Tool = "Tool",
    Configuration = "Configuration"
}

export enum ToolTypes {
    maestro = "maestro",
    rabbitmq = "rabbitmq"
}

export enum ServerTypes {
    amqp = "AMQP"
}

export class TaskConfigurationDtpItem implements IDtpItem {
    constructor(public id: string = "", public name: string = "", public tasks: Array<IDtpItem> = []) { }
    private static readonly tasksIndex = "tasks";
    async toYamlObject(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            Promise.all(this.tasks.map( async task => {
                if (task instanceof DataRepeaterDtpItem) {
                    let dataRepeaterObj: any = {};
                    dataRepeaterObj["amqp-repeater"] = task.toYamlObject();
                    return dataRepeaterObj;
                } else if (task instanceof MaestroDtpItem) {
                    return { simulation: await (task as MaestroDtpItem).toYamlObject() };
                }
            })).then(tasks => {
                const yamlObj: any = {};
                yamlObj.name = this.name;
                yamlObj[TaskConfigurationDtpItem.tasksIndex] = tasks;
                resolve(yamlObj);
            }).catch(err => reject(err));
        });
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormArray(this.tasks.map(task => task.toFormGroup()))
        })
    }

    static parse(yaml: any, mmPathMappingsObj: any, dataRepeaterFmuMappingsObj: any): TaskConfigurationDtpItem {
        const tasks: IDtpItem[] = TaskConfigurationDtpItem.tasksIndex in yaml ? yaml[TaskConfigurationDtpItem.tasksIndex].map((task: any) => {
            if('amqp-repeater' in task){
                return DataRepeaterDtpItem.parse(task['amqp-repeater'], dataRepeaterFmuMappingsObj);
            }

            return MaestroDtpItem.parse(task['simulation'], mmPathMappingsObj);
        }) : [];
        return new TaskConfigurationDtpItem(yaml["id"], yaml["name"], tasks);
    }
}

export class ToolDtpItem implements IDtpItem {
    constructor(public id: string, public path: string = "", public url: string = "", public type: ToolTypes) { }

    toYamlObject(): {} {
        return { path: this.path, url: this.url, type: this.type};
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id, Validators.required),
            path: new FormControl(this.path, Validators.required),
            url: new FormControl(this.path),
            type:  new FormControl(this.type)
        })
    }

    static parse(yaml: any, id: string): ToolDtpItem {
        return new ToolDtpItem(id, yaml["path"], yaml["url"], yaml["type"]);
    }
}

export class ServerDtpItem implements IDtpItem {
    constructor(public id: string, public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: ServerTypes = ServerTypes.amqp) { }

    toYamlObject(): {} {
        return { name: this.id, user: this.username, password: this.password, host: this.host, port: this.port, type: this.servertype, embedded: this.embedded }
    }
    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id, Validators.required),
            servertype: new FormControl(this.servertype),
            username: new FormControl(this.username),
            password: new FormControl(this.password),
            host: new FormControl(this.host),
            port: new FormControl(this.port, [Validators.required, integerValidator]),
            embedded: new FormControl(this.embedded)
        });
    }

    static parse(yaml: any, id: string): ServerDtpItem {
        return new ServerDtpItem(id, yaml["username"], yaml["password"], yaml["host"], yaml["port"], yaml["embedded"], yaml["servertype"]);
    }
}

export class MaestroDtpItem implements IDtpItem {
    constructor(public id: string = "", public name: string = "", public multiModelPath: string = "", public capture_output: boolean = false, public tool: string = "") {}
    async toYamlObject() {
        let project = IntoCpsApp.getInstance().getActiveProject();
        const multiModel: MultiModelConfig = await MultiModelConfig.parse(this.multiModelPath, project.getFmusPath());
        return { name: this.name, execution: { tool: this.tool, capture_output: this.capture_output }, prepare: {tool: this.tool}, config: multiModel.toObject() };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            capture_output: new FormControl(this.capture_output),
            multiModelPath: new FormControl(this.multiModelPath),
            tool: new FormControl(this.tool)
        });
    }

    static parse(yaml: any, mmPathMappingsObj: any): MaestroDtpItem {
        const name =  yaml["name"];
        const multiModelPath: string = mmPathMappingsObj[name] ?? "";
        return new MaestroDtpItem("", name, multiModelPath, yaml["execution"]["capture_output"], yaml["execution"]["tool"])
    }
}

export class SignalSource {
    constructor(public exchange: string = "exchange", public datatype: string = "double", public routing_key: string = "routing_key") { }

    toYamlObject() {
        return {
            exchange: this.exchange,
            datatype: this.datatype,
            routing_key: this.routing_key
        };
    }
}

export class SignalTarget {
    constructor(public exchange: string = "exchange", public pack: string = "JSON", public path = "path", public datatype = "double", public routing_key = "routing_key") { }

    toYamlObject() {
        return {
            exchange: this.exchange,
            pack: this.pack,
            path: this.path,
            datatype: this.datatype,
            routing_key: this.routing_key
        };
    }
}

export class SignalDtpType implements IDtpItem {
    constructor(public id: string = "", public name: string = "", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget) { }

    toYamlObject(): {} {
        return  {
            name: this.name,
            source: this.source.toYamlObject(),
            target: this.target.toYamlObject()
        };
    }
   
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            source_exchange: new FormControl(this.source.exchange),
            source_datatype: new FormControl(this.source.datatype),
            source_routing_key: new FormControl(this.source.routing_key),
            target_exchange: new FormControl(this.target.exchange),
            target_datatype: new FormControl(this.target.datatype),
            target_routing_key: new FormControl(this.target.routing_key),
            target_pack: new FormControl(this.target.pack),
            target_path: new FormControl(this.target.path)
        });
    }

    static parse(yaml: any, name: string): SignalDtpType {
        return new SignalDtpType("", name,
            new SignalSource(yaml["source"]["exchange"], yaml["source"]["datatype"], yaml["source"]["routing_key"]),
            new SignalTarget(yaml["target"]["exchange"], yaml["target"]["pack"], yaml["target"]["path"], yaml["target"]["datatype"], yaml["target"]["routing_key"]));
    }
}

export class DataRepeaterDtpItem implements IDtpItem {
    constructor(public id: string = "", public name: string = "", public tool: string = "", public server_source: string = "", public server_target: string = "", public signals: Array<IDtpItem> = [], public fmu_path: string = "") { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            server_source: new FormControl(this.server_source),
            server_target: new FormControl(this.server_target),
            signals: new FormArray(this.signals.map(signal => signal.toFormGroup())),
            fmu_path: new FormControl(this.fmu_path),
            tool: new FormControl(this.tool)
        });
    }

    toYamlObject() {
        const signalsObj: any = {};
        this.signals.forEach(signal => {
            const dtpSignal = signal as SignalDtpType;
            signalsObj[dtpSignal.name] = { source: dtpSignal.source.toYamlObject(), target: dtpSignal.target.toYamlObject() };
        });

        const t = JSON.stringify(this.signals);
        return { name: this.name, prepare: { tool: this.tool }, servers: { source: this.server_source, target: this.server_target }, signals: signalsObj };
    }

    static parse(yaml: any, dataRepeaterFmuMappingsObj: any): DataRepeaterDtpItem {
        const signals: SignalDtpType[] = Object.keys(yaml["signals"]).map((yamlSigObj: any) => SignalDtpType.parse(yaml["signals"][yamlSigObj], yamlSigObj));
        const name = yaml["name"];
        const fmuPath: string = dataRepeaterFmuMappingsObj[name] ?? "";
        return new DataRepeaterDtpItem("", name, yaml["prepare"]["tool"], yaml["servers"]["source"], yaml["servers"]["target"], signals, fmuPath);
    }
}