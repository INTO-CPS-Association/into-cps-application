import * as fs from "fs"
import {
    integerValidator
} from "../angular2-app/shared/validators";
import { FormArray, FormGroup, FormControl, Validators } from "@angular/forms";

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
    protected static TAG_DTP_TYPES = "dtp_types";

    constructor(
        public dtpTypes: Array<IDtpType> = []
    ) {

    }

    toObject() {
        let dtpTypes: any = {};
        this.dtpTypes.forEach(dtpItem => dtpTypes[dtpItem.type + "_" + dtpItem.name] = dtpItem.toObject());

        var objectToSerialize: any = {};
        objectToSerialize[DTPConfig.TAG_DTP_TYPES] = dtpTypes;
        return objectToSerialize;
    }

    static create(path: string, projectRoot: string, data: any): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            let config = new DTPConfig();
            config.dtpTypes = this.parseDtpTypes(data[this.TAG_DTP_TYPES]);
            config.sourcePath = path;
            resolve(config);
        });
    }

    private static parseDtpTypes(dtpTypes: any): Array<IDtpType> {
        if (dtpTypes) {
            return Object.keys(dtpTypes).map(id => {
                let c = dtpTypes[id];
                if (c.type == DtpTypes.MaestroDtpType) {
                    return MaestroDtpType.parse(c);
                }
                else if (c.type == DtpTypes.ServerDtpType) {
                    return ServerDtpType.parse(c);
                }
                else if (c.type == DtpTypes.SignalDtpType) {
                    return SignalDtpType.parse(c);
                }
                else if (c.type == DtpTypes.DataRepeaterDtpType) {
                    return DataRepeaterDtpType.parse(c);
                }
                else if (c.type == DtpTypes.ToolDtpType) {
                    return ToolDtpType.parse(c);
                }
                else if (c.type == DtpTypes.ConfigurationDtpType) {
                    return TaskConfigurationDtpType.parse(c);
                }
            });
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
    ServerDtpType = "ServerDtpType",
    MaestroDtpType = "MaestroDtpType",
    SignalDtpType = "SignalDtpType",
    DataRepeaterDtpType = "DataRepeaterDtpType",
    ToolDtpType = "ToolDtpType",
    ConfigurationDtpType = "ConfigurationDtpType"
}

export enum ToolTypes {
    Maestro = "Maestro",
    RabbitMq = "RabbitMq"
}

export class TaskConfigurationDtpType implements IDtpType {
    type = DtpTypes.ConfigurationDtpType;
    constructor(public name: string = "", public tasks: IDtpType[]) {}
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormControl(this.tasks)
        })
    }

    toObject() {
        return { name: this.name, type: this.type, tasks: this.tasks};
    }

    static parse(json: any): TaskConfigurationDtpType {
        return new TaskConfigurationDtpType(json["name"], json["tasks"]);
    }
}

export class ToolDtpType implements IDtpType {
    type = DtpTypes.ToolDtpType;
    constructor(public name: string = "", public path: string = "", public toolType: ToolTypes) {}
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
    type = DtpTypes.ServerDtpType;
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
    type = DtpTypes.MaestroDtpType;
    version: number = 2;
    implementation: string = "maestro";
    constructor(
        public name: string = "Maestro",
        public experimentPath: string = "",
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
            experimentpath: this.experimentPath,
            capture_output: this.capture_output
        };
    }

    static parse(json: any): MaestroDtpType {
        return new MaestroDtpType(json["name"], json["experimentpath"], json["capture_output"])
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
    type = DtpTypes.SignalDtpType;
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
            new SignalSource(json["source_exchange"], json["source_datatype"], json["source_routing_key"]),
            new SignalTarget(json["target_exchange"], json["target_pack"], json["target_path"], json["target_datatype"], json["target_routing_key"]));
    }
}

export class DataRepeaterDtpType implements IDtpType {
    type = DtpTypes.DataRepeaterDtpType;
    dtexport_implementation = "AMQP-AMQP"
    dtexport_type = "data-repeater"
    constructor(public name: string = "Data Repeater", public server_source: string = "", public server_target: string = "", public signals: Array<String> = []) { }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, [Validators.required]),
            server_source: new FormControl(this.server_source),
            server_target: new FormControl(this.server_target)
        })
    }
    toObject() {
        return {
            name: this.name,
            type: this.type,
            signals: this.signals
        };
    }

    static parse(json: any): DataRepeaterDtpType {
        return new DataRepeaterDtpType(json["name"], json["server_source"], json["server_target"], json["signals"]);
    }
}