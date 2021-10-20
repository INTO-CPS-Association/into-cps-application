import * as fs from "fs"
import {
    integerValidator
} from "../angular2-app/shared/validators";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Subject } from "rxjs";

export class DTPConfig implements ISerializable {
    sourcePath: string;
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
    protected static TAG_CONFIGURATIONS = "Configurations";
    protected static TAG_TOOLS = "Tools";
    protected static TAG_SERVERS = "Servers";

    constructor(public configurations: Array<IDtpType> = [], public tools: Array<IDtpType> = [], public servers: Array<IDtpType> = [], public tasks: Array<IDtpType> = []) { }

    toObject() {
        var objectToSerialize: any = {};
        objectToSerialize["Configurations"] = this.configurations.map(c => c.toObject());
        objectToSerialize["Tools"] = this.tools.map(c => c.toObject());
        objectToSerialize["Servers"] = this.servers.map(c => c.toObject());
        return objectToSerialize;
    }

    configChanged: Subject<void> = new Subject<void>();

    public emitConfigChanged() {
        this.configChanged.next();
    }

    static create(path: string, projectRoot: string, data: any): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            const configurations: IDtpType[] = this.parseDtpTypes(data[this.TAG_CONFIGURATIONS]);

            let config = new DTPConfig(configurations, this.parseDtpTypes(data[this.TAG_TOOLS]), this.parseDtpTypes(data[this.TAG_SERVERS]), this.getTaskItemsFromConfigurations(configurations));
            config.sourcePath = path;
            resolve(config);
        });
    }

    private static getTaskItemsFromConfigurations(configurations: IDtpType[]): IDtpType[]{
        return configurations.reduce((taskItems: IDtpType[], conf: TaskConfigurationDtpType) => {
            return taskItems.concat(conf.tasks.reduce((tasks: IDtpType[], task: IDtpType) => {
                tasks.push(task);
                return task.type == DtpTypes.DataRepeater ? tasks.concat((task as DataRepeaterDtpType).signals) : tasks;
            }, []));
        }, []);
    }

    private static parseDtpTypes(dtpTypes: any): Array<IDtpType> {
        if (dtpTypes) {
            return Object.keys(dtpTypes).reduce((types: IDtpType[], id: string) => {
                const idtpType = dtpTypes[id];
                if (idtpType.type == DtpTypes.Maestro) {
                    types.push(MaestroDtpType.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Server) {
                    types.push(ServerDtpType.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Signal) {
                    types.push(SignalDtpType.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Tool) {
                    types.push(ToolDtpType.parse(idtpType));
                }else if (idtpType.type == DtpTypes.DataRepeater) {
                    types.push(DataRepeaterDtpType.parse(idtpType));
                } else if (idtpType.type == DtpTypes.Configuration) {
                    types.push(TaskConfigurationDtpType.parse(idtpType));
                }
                return types;
            }, []);
        }
        else return Array<IDtpType>();
    }

    static parse(path: string, projectRoot: string): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
                if (error) return reject(error);

                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);

                    this.create(path, projectRoot, JSON.parse(content.toString()))
                        .then(dtpConfig => resolve(dtpConfig))
                        .catch(error => reject(error));
                });
            });
        });
    }
}

export interface IDtpType {
    name: string;
    type: DtpTypes;
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
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

export class TaskConfigurationDtpType implements IDtpType {
    type = DtpTypes.Configuration;
    constructor(public name: string = "", public tasks: Array<IDtpType> = []) { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormControl(this.tasks)
        })
    }

    toObject() {
        return { name: this.name, type: this.type, tasks: this.tasks.map(task => task.toObject()) };
    }

    static parse(json: any): TaskConfigurationDtpType {
        const tasks: IDtpType[] = json["tasks"].map((task: any) => {
            if(task.type == DtpTypes.DataRepeater){
                return DataRepeaterDtpType.parse(task);
            }

            if (task.type == DtpTypes.Maestro){
                return MaestroDtpType.parse(task)
            }
        });
        return new TaskConfigurationDtpType(json["name"], tasks);
    }
}

export class ToolDtpType implements IDtpType {
    type = DtpTypes.Tool;
    constructor(public name: string = "", public path: string = "", public toolType: ToolTypes) { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            path: new FormControl(this.path, Validators.required),
            toolType: new FormControl(this.toolType, Validators.required)
        })
    }

    toObject() {
        return { name: this.name, type: this.type, path: this.path, toolType: this.toolType };
    }

    static parse(json: any): ToolDtpType {
        return new ToolDtpType(json["name"], json["path"], json["toolType"]);
    }
}

export class ServerDtpType implements IDtpType {
    type = DtpTypes.Server;
    constructor(public id: string, public name: string = "Server", public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: string = "AMQP") { }
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

export class MaestroDtpType implements IDtpType {
    type = DtpTypes.Maestro;
    version: string = '2';
    tool: string = "maestro";
    constructor(
        public name: string = "Maestro",
        public multiModelPath: string = "",
        public capture_output: boolean = false
    ) {
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
        }
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
        }
    }
}

export class SignalDtpType implements IDtpType {
    type = DtpTypes.Signal;
    constructor(public name: string = "Signal", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget) { }
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
        })
    }

    static parse(json: any): SignalDtpType {
        return new SignalDtpType(json["name"],
            new SignalSource(json["source"]["exchange"], json["source"]["datatype"], json["source"]["routing_key"]),
            new SignalTarget(json["target"]["exchange"], json["target"]["pack"], json["target"]["path"], json["target"]["datatype"], json["target"]["routing_key"]));
    }
}

export class DataRepeaterDtpType implements IDtpType {
    type = DtpTypes.DataRepeater;
    dtexport_implementation = "AMQP-AMQP"
    dtexport_type = "data-repeater"
    constructor(public name: string = "Data Repeater", public server_source: string = "", public server_target: string = "", public signals: Array<IDtpType> = []) { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            server_source: new FormControl(this.server_source),
            server_target: new FormControl(this.server_target),
            signals: new FormControl(this.signals)
        })
    }
    toObject() {
        return {
            name: this.name,
            server_source: this.server_source,
            server_target: this.server_target,
            type: this.type,
            signals: this.signals.map(signal => signal.toObject())
        };
    }

    static parse(json: any): DataRepeaterDtpType {
        const signals: SignalDtpType[] = json["signals"].map((signal: any) => {
            return SignalDtpType.parse(signal);
        });
        return new DataRepeaterDtpType(json["name"], json["server_source"], json["server_target"], signals);
    }
}