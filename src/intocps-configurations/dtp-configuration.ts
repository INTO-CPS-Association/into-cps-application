import * as fs from "fs"
import {
    integerValidator
} from "../angular2-app/shared/validators";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { IntoCpsApp } from "../IntoCpsApp";
import { MultiModelConfig } from "./MultiModelConfig";
import * as Path from 'path';

export class DTPConfig implements ISerializable {
    protected sourcePath: string;
    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                fs.writeFile(this.sourcePath, JSON.stringify(this.toObject()), error => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    public static TAG_CONFIGURATIONS = "Configurations";
    public static TAG_TOOLS = "Tools";
    public static TAG_SERVERS = "Servers";

    constructor(public configurations: Array<IDtpItem> = [], public tools: Array<IDtpItem> = [], public servers: Array<IDtpItem> = [], public projectName: string = "") { }

    toObject() {
        var objectToSerialize: any = {};
        objectToSerialize[DTPConfig.TAG_CONFIGURATIONS] = this.configurations.map(configuration => configuration.toObject());
        objectToSerialize[DTPConfig.TAG_TOOLS] = this.tools.map(c => c.toObject());
        objectToSerialize[DTPConfig.TAG_SERVERS] = this.servers.map(c => c.toObject());
        return objectToSerialize;
    }

    static create(path: string, jsonData: any): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            const tools: Array<IDtpItem> = this.parseDtpItems(jsonData[this.TAG_TOOLS]);
            const servers: Array<IDtpItem> = this.parseDtpItems(jsonData[this.TAG_SERVERS]);
            const configurations: Array<IDtpItem> = this.parseDtpItems(jsonData[this.TAG_CONFIGURATIONS]);
            const config = new DTPConfig(configurations, tools, servers, Path.basename(Path.dirname(path)));
            config.sourcePath = path;
            resolve(config);
        });
    }

    public toYaml(): Promise<any> {
        // Format object structure to match yaml schema.
        const serverObjs = this.servers.reduce((objs: any, server: ToolDtpItem) => {
            objs[server.name] = server.toYaml();
            return objs;
        }, {});

        const toolObj = this.tools.reduce((objs: any, tool: ToolDtpItem) => {
            objs[tool.name] = tool.toYaml();
            return objs;
        }, {});

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.configurations.map(configuration => configuration.toYaml())).then(configurationObjs => {
                resolve({ version: "0.0.1", tools: toolObj, servers: serverObjs, configurations: configurationObjs });
            }).catch(err => reject(err));
        });
    }

    private static parseDtpItems(dtpTypes: any): Array<IDtpItem> {
        if (dtpTypes) {
            return Object.keys(dtpTypes).reduce((types: IDtpItem[], id: string) => {
                const idtpType = dtpTypes[id];
                if (idtpType.type == DtpTypes.Server) {
                    types.push(ServerDtpItem.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Tool) {
                    types.push(ToolDtpItem.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Configuration) {
                    types.push(TaskConfigurationDtpItem.parse(idtpType));
                }
                return types;
            }, []);
        }
        else return Array<IDtpItem>();
    }

    static parse(path: string): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
                if (error) return reject(error);

                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);

                    this.create(path, JSON.parse(content.toString()))
                        .then(dtpConfig => resolve(dtpConfig))
                        .catch(error => reject(error));
                });
            });
        });
    }
}

export interface IDtpItem {
    name: string;
    type: DtpTypes;
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
    toYaml(): {};
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

export class TaskConfigurationDtpItem implements IDtpItem {
    public static TAG_SIMULATIONS = "Simulations";
    public static TAG_DATAREPEATERS = "Datarepeaters";
    type = DtpTypes.Configuration;
    constructor(public name: string = "", public tasks: Array<IDtpItem> = []) { }

    toObject() {
        const configurationObj: any = {};
        configurationObj.name = this.name;
        configurationObj.type = this.type;
        const simulations: IDtpItem[] = [];
        configurationObj[TaskConfigurationDtpItem.TAG_DATAREPEATERS] = this.tasks.reduce((dataRepeaters, task) => {
            if(task instanceof DataRepeaterDtpType){
                dataRepeaters.push(task);
            }
            else if(task instanceof MaestroDtpItem){
                simulations.push(task);
            }
            return dataRepeaters;
        }, []);
        configurationObj[TaskConfigurationDtpItem.TAG_SIMULATIONS] = simulations;
        return configurationObj;
    }

    async toYaml(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            Promise.all(this.tasks.map( async task => {
                if (task.type == DtpTypes.DataRepeater) {
                    let dataRepeaterObj: any = {};
                    dataRepeaterObj["amqp-repeater"] = task.toYaml();
                    return dataRepeaterObj;
                } else if (task.type == DtpTypes.Maestro) {
                    return { simulation: await (task as MaestroDtpItem).toYaml() };
                }
            })).then(tasks => {
                resolve({ name: this.name, tasks: tasks });
            }).catch(err => reject(err));
        });
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormArray(this.tasks.map(task => task.toFormGroup()))
        })
    }

    static parse(json: any): TaskConfigurationDtpItem {
        const tasks: IDtpItem[] = (json[TaskConfigurationDtpItem.TAG_DATAREPEATERS]).map((json:any) => DataRepeaterDtpType.parse(json)).concat(json[TaskConfigurationDtpItem.TAG_SIMULATIONS].map((json:any) => MaestroDtpItem.parse(json)));
        return new TaskConfigurationDtpItem(json["name"], tasks);
    }
}

export class ToolDtpItem implements IDtpItem {
    type = DtpTypes.Tool;
    constructor(public name: string = "", public path: string = "", public url: string = "", public toolType: ToolTypes) { }

    toYaml(): {} {
        return { path: this.path, url: this.url };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            path: new FormControl(this.path),
            url: new FormControl(this.path),
            toolType: new FormControl(this.toolType, Validators.required)
        })
    }

    toObject() {
        return { name: this.name, type: this.type, path: this.path, url: this.url, toolType: this.toolType };
    }

    static parse(json: any): ToolDtpItem {
        return new ToolDtpItem(json["name"], json["path"], json["url"], json["toolType"]);
    }
}

export class ServerDtpItem implements IDtpItem {
    type = DtpTypes.Server;
    constructor(public id: string, public name: string = "", public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: string = "AMQP") { }
    toYaml(): {} {
        return { name: this.name, user: this.username, password: this.password, host: this.host, port: this.port, type: this.servertype, embedded: this.embedded }
    }
    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id, [Validators.required]),
            name: new FormControl(this.name),
            servertype: new FormControl(this.servertype),
            username: new FormControl(this.username),
            password: new FormControl(this.password),
            host: new FormControl(this.host),
            port: new FormControl(this.port, [Validators.required, integerValidator]),
            embedded: new FormControl(this.embedded)

        })
    }
    toObject() {
        return { id: this.id, name: this.name, type: this.type, username: this.username, password: this.password, host: this.host, port: this.port, embedded: this.embedded, servertype: this.servertype };
    }
    static parse(json: any): ServerDtpItem {
        return new ServerDtpItem(json["id"], json["name"], json["username"], json["password"], json["host"], json["port"], json["embedded"], json["servertype"]);
    }
}

export class MaestroDtpItem implements IDtpItem {
    type = DtpTypes.Maestro;
    version: string = '2';
    constructor(
        public name: string = "",
        public multiModelPath: string = "",
        public capture_output: boolean = false,
        public tool: string = ""
    ) {
    }
    async toYaml() {
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

    toObject() {
        return {
            name: this.name,
            type: this.type,
            multiModelPath: this.multiModelPath,
            capture_output: this.capture_output,
            tool: this.tool
        };
    }

    static parse(json: any): MaestroDtpItem {
        return new MaestroDtpItem(json["name"], json["multiModelPath"], json["capture_output"], json["tool"])
    }
}

export class SignalSource {
    constructor(public exchange: string = "exchange", public datatype: string = "double", public routing_key: string = "routing_key") { }
    toObject() {
        return {
            exchange: this.exchange,
            datatype: this.datatype,
            routing_key: this.routing_key
        };
    }
}

export class SignalTarget {
    constructor(public exchange: string = "exchange", public pack: string = "JSON", public path = "path", public datatype = "double", public routing_key = "routing_key") { }

    toObject() {
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
    type = DtpTypes.Signal;
    constructor(public name: string = "", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget) { }
    toYaml(): {} {
        throw new Error("Method not implemented.");
    }
    toObject() {
        let obj: any = {
            type: this.type,
            name: this.name,
            source: this.source.toObject(),
            target: this.target.toObject()
        }
        return obj;
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

    static parse(json: any): SignalDtpType {
        return new SignalDtpType(json["name"],
            new SignalSource(json["source"]["exchange"], json["source"]["datatype"], json["source"]["routing_key"]),
            new SignalTarget(json["target"]["exchange"], json["target"]["pack"], json["target"]["path"], json["target"]["datatype"], json["target"]["routing_key"]));
    }
}

export class DataRepeaterDtpType implements IDtpItem {
    type = DtpTypes.DataRepeater;
    constructor(public name: string = "", public tool: string = "", public server_source: string = "", public server_target: string = "", public signals: Array<IDtpItem> = [], public fmu_path: string = "") { }
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

    toYaml() {
        const signalsObj: any = {};
        this.signals.forEach(signal => {
            const dtpSignal = signal as SignalDtpType;
            signalsObj[dtpSignal.name] = { source: dtpSignal.source.toObject(), target: dtpSignal.target.toObject() };
        });

        const t = JSON.stringify(this.signals);
        return { name: this.name, prepare: { tool: this.tool }, servers: { source: this.server_source, target: this.server_target }, signals: signalsObj };
    }

    toObject() {
        return {
            name: this.name,
            tool: this.tool,
            server_source: this.server_source,
            server_target: this.server_target,
            type: this.type,
            signals: this.signals.map(signal => signal.toObject()),
            fmu_path: this.fmu_path
        };
    }

    static parse(json: any): DataRepeaterDtpType {
        const signals: SignalDtpType[] = json["signals"].map((json: any) => SignalDtpType.parse(json));
        return new DataRepeaterDtpType(json["name"], json["tool"], json["server_source"], json["server_target"], signals, json["fmu_path"]);
    }
}