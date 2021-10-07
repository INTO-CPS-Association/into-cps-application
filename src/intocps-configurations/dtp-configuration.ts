import * as fs from "fs"
import {
    integerValidator
} from "../angular2-app/shared/validators";
import { VariableStepConstraint} from "./CoSimulationConfig"
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
        public dtpTypes: Array<VariableStepConstraint> = []
    ) {

    }

    toObject() {
        let dtpTypes: any = {};
        this.dtpTypes.forEach(x => dtpTypes[x.id] = x.toObject());

        var objectToSerialize:any= {};
        objectToSerialize[DTPConfig.TAG_DTP_TYPES]=dtpTypes;
        return  objectToSerialize;
    }

    static create(path: string, projectRoot: string, data: any): Promise<DTPConfig> {
        return new Promise<DTPConfig>((resolve, reject) => {
            let config = new DTPConfig();
            config.dtpTypes = this.parseDtpTypes(data[this.TAG_DTP_TYPES]);
            config.sourcePath = path;
            resolve(config);
        });
    }

    private static parseDtpTypes(dtpTypes: any): Array<VariableStepConstraint> {
        if (dtpTypes) {
            return Object.keys(dtpTypes).map(id => {
                let c = dtpTypes[id];
                if (c.type === "MaestroDtpType") {
                    return MaestroDtpType.parse(c);
                }
                else if (c.type == "ServerDtpType"){
                    return ServerDtpType.parse(c);
                }
                else if (c.type == "SignalDtpType"){
                    return SignalDtpType.parse(c);
                }
                else if (c.type = "DataRepeaterDtpType"){
                    return DataRepeaterDtpType.parse(c);
                }
            });
        }
        else return Array<VariableStepConstraint>();

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
export class ServerDtpType implements VariableStepConstraint {
    type = "ServerDtpType";
    constructor(public id: string = "server", public name: string = "name", public username: string = "", public password: string = "", public host: string = "", public port: number = 5672, public embedded: boolean = true, public servertype: string = "AMQP"){}
    toFormGroup(){
        return new FormGroup({
            id: new FormControl(this.id,[Validators.required]),
            name: new FormControl(this.name),
            servertype: new FormControl(this.servertype),
            username: new FormControl(this.username),
            password: new FormControl(this.password),
            host: new FormControl(this.host),
            port: new FormControl(this.port, [Validators.required, integerValidator]),
            embedded: new FormControl(this.embedded)

        })
    }
    toObject(){
        let obj: any = {id: this.id, name: this.name, type: this.type, username:this.username, password: this.password, host:this.host, port:this.port, embedded:this.embedded, servertype: this.servertype};
        return obj;
    }
    static parse(json: any): ServerDtpType
    {
        return new ServerDtpType(json["id"], json["name"], json["username"], json["password"], json["host"], json["port"], json["embedded"], json["servertype"]);

    }
}
export class MaestroDtpType implements VariableStepConstraint {
    type = "MaestroDtpType";
    version: number = 2;
    implementation: string = "maestro";
    constructor(
        public id: string = "Maestro",
        public experimentPath: string = "",
        public capture_output: boolean = false
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id,[Validators.required]),
            capture_output: new FormControl(this.capture_output)
        });
    }

    toObject() {
        let obj: any = {
            id: this.id,
            type: this.type,
            experimentpath: this.experimentPath,
            capture_output: this.capture_output
        };

        return obj;
    }

    static parse(json: any): MaestroDtpType{
        return new MaestroDtpType(json["id"], json["experimentpath"], json["capture_output"])
    }
}

export class SignalSource{
    constructor(public exchange: string = "exchange", public datatype: string = "double", public routing_key: string = "routing_key"){}
    toObject(){let obj: any = {
        exchange: this.exchange,
        datatype: this.datatype,
        routing_key: this.routing_key
    }}
}

export class SignalTarget{
    constructor(public exchange: string = "exchange", public pack: string = "JSON", public path="path", public datatype="double", public routing_key="routing_key"){}

    toObject(){let obj: any = {
        exchange: this.exchange,
        pack: this.pack,
        path: this.path,
        datatype: this.datatype,
        routing_key: this.routing_key
    }}
}

export class SignalDtpType{
    type="SignalDtpType"
    constructor(public id: string = "Signal", public name: string = "name", public source: SignalSource = new SignalSource(), public target: SignalTarget = new SignalTarget){}
    toObject(){
        let obj: any = {
            type: this.type,
            id: this.id,
            name: this.name,
            source: this.source.toObject(),
            target: this.target.toObject()
        }
        return obj;
    }
    toFormGroup(){
        return new FormGroup({
            id: new FormControl(this.id),
            name: new FormControl(this.name),
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

    static parse(json: any): SignalDtpType{
        return new SignalDtpType(json["id"], json["name"], 
        new SignalSource(json["source_exchange"], json["source_datatype"], json["source_routing_key"]), 
        new SignalTarget(json["target_exchange"], json["target_pack"], json["target_path"], json["target_datatype"], json["target_routing_key"]));
    }
}

export class DataRepeaterDtpType implements VariableStepConstraint{
    type = "DataRepeaterDtpType";
    dtexport_implementation="AMQP-AMQP"
    dtexport_type="data-repeater"
    constructor(public id: string = "Data Repeater", public server_source:string="", public server_target:string="", public signals: Array<String>=[]){}
    toFormGroup(){
        return new FormGroup({id: new FormControl(this.id), 
            server_source: new FormControl(this.server_source), 
            server_target: new FormControl(this.server_target)})
    }
    toObject(){
        let obj: any = {
            id: this.id,
            type: this.type,
            signals: this.signals
        };

        return obj;
    }

    static parse(json: any): DataRepeaterDtpType {
        return new DataRepeaterDtpType(json["id"], json["server_source"], json["server_target"], json["signals"]);
    }
}