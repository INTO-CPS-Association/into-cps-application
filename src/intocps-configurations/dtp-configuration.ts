import * as fs from "fs"
import {
    integerValidator
} from "../angular2-app/shared/validators";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { IntoCpsApp } from "../IntoCpsApp";
import { MultiModelConfig } from "./MultiModelConfig";

export class DTPConfig implements ISerializable {
    public typeAdded: Subject<IDtpItem> = new Subject<IDtpItem>();
    public typeRemoved: Subject<IDtpItem> = new Subject<IDtpItem>();
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
    public static TAG_NAME = "Name";

    constructor(public configurations: Array<IDtpItem> = [], public tools: Array<IDtpItem> = [], public servers: Array<IDtpItem> = [], public tasks: Array<IDtpItem> = []) { }

    toObject() {
        var objectToSerialize: any = {};
        objectToSerialize[DTPConfig.TAG_CONFIGURATIONS] = this.configurations.map(c => c.toObject());
        objectToSerialize[DTPConfig.TAG_TOOLS] = this.tools.map(c => c.toObject());
        objectToSerialize[DTPConfig.TAG_SERVERS] = this.servers.map(c => c.toObject());
        return objectToSerialize;
    }

    public emitTypeAdded(type: IDtpItem) {
        this.typeAdded.next(type);
    }

    public emitTypeRemoved(type: IDtpItem) {
        this.typeRemoved.next(type);
    }

    static create(path: string, jsonData: any): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            const tasks: Array<IDtpItem> = [];
            const configurations: Array<IDtpItem> = this.parseConfigurations(jsonData[this.TAG_CONFIGURATIONS], tasks);
            const tools: Array<IDtpItem> = this.parseSimpleDtpTypes(jsonData[this.TAG_TOOLS]);
            const servers: Array<IDtpItem> = this.parseSimpleDtpTypes(jsonData[this.TAG_SERVERS]);

            let config = new DTPConfig(configurations, tools, servers, tasks);
            config.sourcePath = path;
            resolve(config);
        });
    }

    public toYaml(): Promise<any> {
        // Format object structure to match yaml schema.
        const serverObjs = this.servers.map(server => server.toYaml());
        const toolObj = this.tools.reduce((tools: any, tool: ToolDtpType) => {
            tools[tool.toolType] = { path: tool.path }
            return tools;
        }, {});

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.configurations.map(configuration => configuration.toYaml())).then(configurationObjs => {
                resolve({ version: "0.0.1", tools: toolObj, servers: serverObjs, configurations: configurationObjs });
            }).catch(err => reject(err));
        });
    }

    private static parseSimpleDtpTypes(dtpTypes: any): Array<IDtpItem> {
        if (dtpTypes) {
            return Object.keys(dtpTypes).reduce((types: IDtpItem[], id: string) => {
                const idtpType = dtpTypes[id];
                if (idtpType.type == DtpTypes.Server) {
                    types.push(ServerDtpType.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Tool) {
                    types.push(ToolDtpType.parse(idtpType));
                }
                return types;
            }, []);
        }
        else return Array<IDtpItem>();
    }

    private static parseConfigurations(configurationsJson: any, nestedTasks: Array<IDtpItem>): Array<TaskConfigurationDtpType> {
        if (configurationsJson) {
            return Object.keys(configurationsJson).reduce((configurations: TaskConfigurationDtpType[], id: string) => {
                const idtpType = configurationsJson[id];
                configurations.push(TaskConfigurationDtpType.parse(idtpType, nestedTasks));
                return configurations;
            }, []);
        }
        else return Array<TaskConfigurationDtpType>();
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

export interface KeyValue {
    [key: string]: any;
}

export class TaskConfigurationDtpType implements IDtpItem {
    type = DtpTypes.Configuration;
    constructor(public name: string = "", public tasks: Array<IDtpItem> = []) { }

    async toYaml() {
        const tasks = await Promise.all(this.tasks.map( async task => {
            if (task.type == DtpTypes.DataRepeater) {
                let dataRepeaterObj: any = {};
                dataRepeaterObj["data-repeater"] = task.toYaml();
                return dataRepeaterObj;
            } else if (task.type == DtpTypes.Maestro) {
                return { simulation: await (task as MaestroDtpType).toYaml() };
            }
        }));

        return { name: this.name, tasks: tasks };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormControl(this.tasks)
        })
    }

    toObject() {
        return { name: this.name, type: this.type, tasks: this.tasks.map(task => task.toObject()) };
    }

    static parse(json: any, nestedTaskItems: Array<IDtpItem>): TaskConfigurationDtpType {
        const tasks: IDtpItem[] = json["tasks"].map((task: any) => {
            if (task.type == DtpTypes.DataRepeater) {
                let dataRepeater = nestedTaskItems.find(nt => nt.type == DtpTypes.DataRepeater && nt.name == task.name);
                if (dataRepeater) {
                    return dataRepeater;
                }
                dataRepeater = DataRepeaterDtpType.parse(task, nestedTaskItems);
                nestedTaskItems.push(dataRepeater);
                return dataRepeater;
            }

            if (task.type == DtpTypes.Maestro) {
                let maestro = nestedTaskItems.find(nt => nt.type == DtpTypes.Maestro && nt.name == task.name);
                if (maestro) {
                    return maestro;
                }
                maestro = MaestroDtpType.parse(task);
                nestedTaskItems.push(maestro);
                return maestro;
            }
        });
        return new TaskConfigurationDtpType(json["name"], tasks);
    }
}

export class ToolDtpType implements IDtpItem {
    type = DtpTypes.Tool;
    constructor(public name: string = "", public path: string = "", public url: string = "", public toolType: ToolTypes) { }
    toYaml(): {} {
        throw new Error("Method not implemented.");
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

    static parse(json: any): ToolDtpType {
        return new ToolDtpType(json["name"], json["path"], json["url"], json["toolType"]);
    }
}

export class ServerDtpType implements IDtpItem {
    type = DtpTypes.Server;
    constructor(public id: string, public name: string = "Server", public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: string = "AMQP") { }
    toYaml(): {} {
        return { id: this.id, name: this.name, user: this.username, password: this.password, host: this.host, port: this.port, type: this.servertype, embedded: this.embedded }
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
    static parse(json: any): ServerDtpType {
        return new ServerDtpType(json["id"], json["name"], json["username"], json["password"], json["host"], json["port"], json["embedded"], json["servertype"]);
    }
}

export class MaestroDtpType implements IDtpItem {
    type = DtpTypes.Maestro;
    version: string = '2';
    tool: string = "maestro";
    constructor(
        public name: string = "Maestro",
        public multiModelPath: string = "",
        public capture_output: boolean = false
    ) {
    }
    async toYaml() {
        let project = IntoCpsApp.getInstance().getActiveProject();
        const multiModel: MultiModelConfig = await MultiModelConfig.parse(this.multiModelPath, project.getFmusPath());
        return { name: this.name, execution: { capture_output: this.capture_output }, tool: this.tool, version: this.version, config: multiModel.toObject() };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            capture_output: new FormControl(this.capture_output)
        });
    }

    toObject() {
        return {
            name: this.name,
            type: this.type,
            multiModelPath: this.multiModelPath,
            capture_output: this.capture_output
        };
    }

    static parse(json: any): MaestroDtpType {
        return new MaestroDtpType(json["name"], json["multiModelPath"], json["capture_output"])
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
    constructor(public name: string = "Signal", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget) { }
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
    dtexport_implementation = "AMQP-AMQP"
    dtexport_type = "data-repeater"
    constructor(public name: string = "Data Repeater", public server_source: string = "", public server_target: string = "", public signals: Array<IDtpItem> = [], public fmu_path: string = "") { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            server_source: new FormControl(this.server_source, [Validators.required]),
            server_target: new FormControl(this.server_target, [Validators.required]),
            signals: new FormControl(this.signals, [Validators.required]),
            fmu_path: new FormControl(this.fmu_path)
        });
    }

    toYaml() {
        const signalsObj: any = {};
        this.signals.forEach(signal => {
            const dtpSignal = signal as SignalDtpType;
            signalsObj[dtpSignal.name] = { source: dtpSignal.source.toObject(), target: dtpSignal.target.toObject() };
        });

        const t = JSON.stringify(this.signals);
        return { name: this.name, tool: this.dtexport_implementation, servers: { source: this.server_source, target: this.server_target }, signals: signalsObj };
    }

    toObject() {
        return {
            name: this.name,
            server_source: this.server_source,
            server_target: this.server_target,
            type: this.type,
            signals: this.signals.map(signal => signal.toObject()),
            fmu_path: this.fmu_path
        };
    }

    static parse(json: any, nestedTaskItems: Array<IDtpItem>): DataRepeaterDtpType {
        const signals: SignalDtpType[] = json["signals"].map((sig: any) => {
            let signal = nestedTaskItems.find(nt => nt.type == DtpTypes.Signal && nt.name == sig.name);
            if (signal) {
                return signal;
            }
            signal = SignalDtpType.parse(sig);
            nestedTaskItems.push(signal);
            return signal;
        });
        return new DataRepeaterDtpType(json["name"], json["server_source"], json["server_target"], signals, json["fmu_path"]);
    }
}