import * as fs from "fs"
import { VariableStepConstraint } from "./CoSimulationConfig"
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
                    return new MaestroDtpType(id)
                }
                else if (c.type === "AMQPRepeaterDtpType") {
                    return new AMQPRepeaterDtpType(id)
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

export class MaestroDtpType implements VariableStepConstraint {
    type = "MaestroDtpType";

    constructor(
        public id: string = "MaestroDtpType"
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id)
        });
    }

    toObject() {
        let obj: any = {
            type: this.type
        };

        return obj;
    }
}

export class AMQPRepeaterDtpType implements VariableStepConstraint {
    type = "AMQPRepeaterDtpType";

    constructor(
        public id: string = "AMQPRepeaterDtpType"
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id)
        });
    }

    toObject() {
        let obj: any = {
            type: this.type
        };

        return obj;
    }
}