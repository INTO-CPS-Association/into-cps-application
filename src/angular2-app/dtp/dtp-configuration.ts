import {
    integerValidator, uniqueGroupPropertyValidator
} from "../shared/validators";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { IntoCpsApp } from "../../IntoCpsApp";
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import * as fs from "fs";
import * as Path from 'path';
import { CoSimulationConfig } from "../../intocps-configurations/CoSimulationConfig";

export class DTPConfig {
    private static readonly toolsIndex = "tools";
    private static readonly serversIndex = "servers";
    private static readonly configurationsIndex = "configurations";
    private static readonly mappingsFile = "PathMappings.json";
    private static readonly mmMappingsIndex = "multiModelPathMappings";
    private static readonly datarepeaterMappingsIndex = "dataRepeaterFmuMappings";
    private static readonly coeMappingsIndex = "coePathMappings";
    private readonly mappingsFilePath: string;

    public toolTypes: string[] = [];

    constructor(public configurations: Array<TaskConfigurationDtpItem> = [], public tools: Array<ToolDtpItem> = [], public servers: Array<ServerDtpItem> = [], public projectName: string = "", public projectPath: string = "", mappingsFilePath: string = "") {
        this.mappingsFilePath = mappingsFilePath;
    }

    public addMappingPath(item: IDtpItem) {
        const obj = JSON.parse(fs.readFileSync(this.mappingsFilePath, { encoding: 'utf8', flag: 'r' }));
        if (item instanceof MaestroDtpItem) {
            if (!obj[DTPConfig.mmMappingsIndex]) {
                obj[DTPConfig.mmMappingsIndex] = {};
            }
            if (!obj[DTPConfig.coeMappingsIndex]) {
                obj[DTPConfig.coeMappingsIndex] = {};
            }
            obj[DTPConfig.mmMappingsIndex][item.name] = item.multiModelPath;
            obj[DTPConfig.coeMappingsIndex][item.name] = item.coePath;
        } else if (item instanceof DataRepeaterDtpItem) {
            obj[DTPConfig.datarepeaterMappingsIndex][item.name] = item.fmu_path;
        } else {
            return;
        }
        fs.writeFile(this.mappingsFilePath, JSON.stringify(obj), err => {if(err) console.warn(err)});
    }

    public removeMappingPath(item: IDtpItem, removeLinkedFile: boolean) {
        const obj = JSON.parse(fs.readFileSync(this.mappingsFilePath, { encoding: 'utf8', flag: 'r' }));
        if (item instanceof MaestroDtpItem) {
            delete obj[DTPConfig.mmMappingsIndex][item.name];
            delete obj[DTPConfig.coeMappingsIndex][item.name];
            if(removeLinkedFile) {
                fs.unlink(item.multiModelPath, err => { if (err) console.warn(`Unable to delete mm file linked with maestro: ${err}`) });
                fs.unlink(item.coePath, err => { if (err) console.warn(`Unable to delete coe file linked with maestro: ${err}`) });
            }
        } else if (item instanceof DataRepeaterDtpItem) {
            delete obj[DTPConfig.datarepeaterMappingsIndex][item.name];
            fs.unlink(item.fmu_path, err => { if (err) console.warn(`Unable to delete fmu linked with datarepeater: ${err}`) });
        } else {
            return;
        }
        fs.writeFile(this.mappingsFilePath, JSON.stringify(obj), err => {if(err) console.warn(err)});
    }

    public static createFromYamlObj(yamlConfig: any, projectName: string, projectPath: string): DTPConfig {
        const tools = DTPConfig.toolsIndex in yamlConfig ? Object.keys(yamlConfig[DTPConfig.toolsIndex]).map(toolId => {
            return ToolDtpItem.parse(yamlConfig[DTPConfig.toolsIndex][toolId], toolId);
        }) : [];

        const servers = DTPConfig.serversIndex in yamlConfig ? Object.keys(yamlConfig[DTPConfig.serversIndex]).map(serverId => {
            return ServerDtpItem.parse(yamlConfig[DTPConfig.serversIndex][serverId], serverId);
        }) : [];

        const mappingsFilePath = Path.join(projectPath, DTPConfig.mappingsFile);
        DTPConfig.ensureMappingFileExists(mappingsFilePath);
        let mappings: any;
        try {
            mappings = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: 'utf8', flag: 'r' }));
        } catch (ex) {
            mappings = {};
            console.warn("Unable to parse path mappings from file at path '" + mappingsFilePath + "' due to: " + ex);
        } finally {
            const configurations = DTPConfig.configurationsIndex in yamlConfig ? yamlConfig[DTPConfig.configurationsIndex].map((configuration: any) => {
                return TaskConfigurationDtpItem.parse(configuration, mappings[DTPConfig.mmMappingsIndex] ?? {}, mappings[DTPConfig.coeMappingsIndex] ?? {}, mappings[DTPConfig.datarepeaterMappingsIndex] ?? {});
            }) : [];

            return new DTPConfig(configurations, tools, servers, projectName, projectPath, mappingsFilePath);
        }
    }

    private static ensureMappingFileExists(path: string) {
        if (!fs.existsSync(path)) {
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
    isCreatedOnServer: boolean;
    name: string;
    toFormGroup(): FormGroup;
    toYamlObject(): {};
}

export enum DtpType {
    Server = "Server",
    Maestro = "Maestro",
    Signal = "Signal",
    DataRepeater = "Data-repeater",
    Tool = "Tool",
    Configuration = "Configuration"
}

export enum ToolType {
    maestroV2 = "maestroV2",
    rabbitmq = "rabbitmq"
}

export enum ServerType {
    amqp = "AMQP"
}

export class TaskConfigurationDtpItem implements IDtpItem {
    constructor(public name: string = "", public tasks: Array<IDtpItem> = [], public isCreatedOnServer: boolean = false) { }
    private static readonly tasksIndex = "tasks";
    async toYamlObject(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            Promise.all(this.tasks.map(async task => 
                    task instanceof MaestroDtpItem ? await (task as MaestroDtpItem).toYamlObject() : task.toYamlObject())
                ).then(tasks => {
                    const yamlObj: any = {};
                    yamlObj.id = this.name;
                    yamlObj.name = this.name;
                    yamlObj[TaskConfigurationDtpItem.tasksIndex] = tasks;
                    resolve(yamlObj);
            }).catch(err => reject(err));
        });
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormArray(this.tasks.map(task => task.toFormGroup()), uniqueGroupPropertyValidator("name"))
        })
    }

    static parse(yaml: any, mmPathMappingsObj: any, coeMappingsObj: any, dataRepeaterFmuMappingsObj: any): TaskConfigurationDtpItem {
        const tasks: IDtpItem[] = TaskConfigurationDtpItem.tasksIndex in yaml ? yaml[TaskConfigurationDtpItem.tasksIndex].map((task: any) => {
            if ('amqp-repeater' in task) {
                return DataRepeaterDtpItem.parse(task, dataRepeaterFmuMappingsObj);
            }
            return MaestroDtpItem.parse(task, mmPathMappingsObj, coeMappingsObj);
        }) : [];
        return new TaskConfigurationDtpItem(yaml["id"], tasks, true);
    }
}

export class ToolDtpItem implements IDtpItem {
    constructor(public name: string, public path: string = "", public url: string = "", public type: ToolType, public isCreatedOnServer: boolean = false) { }

    toYamlObject(): {} {
        return { path: this.path, url: this.url, type: this.type };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            path: new FormControl(this.path, Validators.required),
            url: new FormControl(this.path),
            type: new FormControl(this.type)
        })
    }

    static parse(yaml: any, name: string): ToolDtpItem {
        return new ToolDtpItem(name, yaml["path"], yaml["url"], yaml["type"], true);
    }
}

export class ServerDtpItem implements IDtpItem {
    constructor(public name: string, public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: ServerType = ServerType.amqp, public isCreatedOnServer: boolean = false) { }

    toYamlObject(): {} {
        return { name: this.name, user: this.username, password: this.password, host: this.host, port: this.port, type: this.servertype, embedded: this.embedded }
    }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            servertype: new FormControl(this.servertype),
            username: new FormControl(this.username),
            password: new FormControl(this.password),
            host: new FormControl(this.host),
            port: new FormControl(this.port, [Validators.required, integerValidator]),
            embedded: new FormControl(this.embedded)
        });
    }

    static parse(yaml: any, name: string): ServerDtpItem {
        return new ServerDtpItem(name, yaml["username"], yaml["password"], yaml["host"], yaml["port"], yaml["embedded"], yaml["servertype"], true);
    }
}

export class MaestroDtpItem implements IDtpItem {
    private static readonly objectIdentifier: string = "simulation";
    constructor(public name: string = "", public multiModelPath: string = "", public coePath: string = "", public capture_output: boolean = false, public tool: string = "", public isCreatedOnServer: boolean = false) { }
    async toYamlObject() {
        let project = IntoCpsApp.getInstance().getActiveProject();
        const coeConfig: CoSimulationConfig = await CoSimulationConfig.parse(this.coePath, project.getRootFilePath(), project.getFmusPath());
        // Insert absolute path to fmus
        const mmObj = coeConfig.multiModel.toObject();
        const url = require('url');
        Object.keys(mmObj.fmus).forEach(key => {
            mmObj.fmus[key] = url.fileURLToPath(Path.join(project.getFmusPath(), mmObj.fmus[key]));
        })
        const configObj = Object.assign(coeConfig.toObject(), mmObj);
        const maestroYamlObj: any = {};
        maestroYamlObj[MaestroDtpItem.objectIdentifier] = { name: this.name, execution: { tool: this.tool, capture_output: this.capture_output }, prepare: { tool: this.tool }, config: configObj };
        maestroYamlObj.id = this.name;
        return maestroYamlObj;
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            capture_output: new FormControl(this.capture_output),
            tool: new FormControl(this.tool)
        });
    }

    static parse(yaml: any, mmPathMappingsObj: any, coeMappingsObj: any): MaestroDtpItem {
        const maestroYamlObj = yaml[this.objectIdentifier];
        const name = yaml["id"];
        const multiModelPath: string = mmPathMappingsObj[name] ?? "";
        const coePath: string = coeMappingsObj[name] ?? "";
        return new MaestroDtpItem(name, multiModelPath, coePath, maestroYamlObj["execution"]["capture_output"], maestroYamlObj["execution"]["tool"], true)
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
    constructor(public name: string = "", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget, public isCreatedOnServer: boolean = false) { }

    toYamlObject(): {} {
        return {
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
        return new SignalDtpType(name,
            new SignalSource(yaml["source"]["exchange"], yaml["source"]["datatype"], yaml["source"]["routing_key"]),
            new SignalTarget(yaml["target"]["exchange"], yaml["target"]["pack"], yaml["target"]["path"], yaml["target"]["datatype"], yaml["target"]["routing_key"]), true);
    }
}

export class DataRepeaterDtpItem implements IDtpItem {
    private static readonly objectIdentifier: string = "amqp-repeater";
    constructor(public name: string = "", public tool: string = "", public server_source: string = "", public server_target: string = "", public signals: Array<IDtpItem> = [], public fmu_path: string = "", public isCreatedOnServer: boolean = false) { }
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
        const dataRepeaterObject: any = {};
        dataRepeaterObject[DataRepeaterDtpItem.objectIdentifier] = { name: this.name, prepare: { tool: this.tool }, servers: { source: this.server_source, target: this.server_target }, signals: signalsObj };
        dataRepeaterObject.id = this.name;
        return dataRepeaterObject;
    }

    static parse(yaml: any, dataRepeaterFmuMappingsObj: any): DataRepeaterDtpItem {
        const dataRepeaterYamlObj = yaml[this.objectIdentifier];
        const signals: SignalDtpType[] = Object.keys(dataRepeaterYamlObj["signals"]).map((yamlSigObj: any) => SignalDtpType.parse(dataRepeaterYamlObj["signals"][yamlSigObj], yamlSigObj));
        const name = yaml["id"];
        const fmuPath: string = dataRepeaterFmuMappingsObj[name] ?? "";
        return new DataRepeaterDtpItem(name, dataRepeaterYamlObj["prepare"]["tool"], dataRepeaterYamlObj["servers"]["source"], dataRepeaterYamlObj["servers"]["target"], signals, fmuPath, true);
    }
}