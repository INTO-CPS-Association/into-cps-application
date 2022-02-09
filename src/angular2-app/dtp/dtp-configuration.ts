import { integerValidator } from "../shared/validators";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { IntoCpsApp } from "../../IntoCpsApp";
import * as fs from "fs";
import * as Path from "path";
import { CoSimulationConfig } from "../../intocps-configurations/CoSimulationConfig";
const { v4: uuidv4 } = require("uuid");

export class DTPConfig {
    private static readonly toolsIndex = "tools";
    private static readonly serversIndex = "servers";
    private static readonly configurationsIndex = "configurations";
    private static readonly mappingsFile = "PathMappings.json";
    public readonly fileLinksPath: string;

    constructor(
        public configurations: Array<TaskConfigurationDtpItem> = [],
        public tools: Array<ToolDtpItem> = [],
        public servers: Array<ServerDtpItem> = [],
        public projectName: string = "",
        public projectPath: string = "",
        mappingsFilePath: string = "",
        public signalDataTypes: string[] = [],
        public serverTypes: string[] = []
    ) {
        this.fileLinksPath = mappingsFilePath;
    }

    public static createFromYamlObj(yamlConfig: any, projectName: string, projectPath: string): DTPConfig {
        const tools =
            DTPConfig.toolsIndex in yamlConfig
                ? Object.keys(yamlConfig[DTPConfig.toolsIndex]).map((toolId) => {
                      return ToolDtpItem.parse(yamlConfig[DTPConfig.toolsIndex][toolId], toolId);
                  })
                : [];

        const servers =
            DTPConfig.serversIndex in yamlConfig
                ? Object.keys(yamlConfig[DTPConfig.serversIndex]).map((serverId) => {
                      return ServerDtpItem.parse(yamlConfig[DTPConfig.serversIndex][serverId], serverId);
                  })
                : [];

        const mappingsFilePath = Path.join(projectPath, DTPConfig.mappingsFile);
        DTPConfig.ensureMappingFileExists(mappingsFilePath);
        const configurations =
            DTPConfig.configurationsIndex in yamlConfig
                ? yamlConfig[DTPConfig.configurationsIndex].map((configuration: any) => {
                      return TaskConfigurationDtpItem.parse(configuration, mappingsFilePath, projectPath);
                  })
                : [];

        return new DTPConfig(configurations, tools, servers, projectName, projectPath, mappingsFilePath);
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

export abstract class dtpItem {
    public readonly id: string;
    constructor(public isCreatedOnServer: boolean = false, id: string = "", public name: string) {
        this.id = id ? id : uuidv4();
    }
    abstract toFormGroup(): FormGroup;
    abstract toYamlObject(): {};
}

export enum DtpType {
    Server = "Server",
    Maestro = "Maestro",
    Signal = "Signal",
    DataRepeater = "Data-repeater",
    Tool = "Tool",
    Configuration = "Configuration",
}

export enum ToolType {
    maestroV2 = "maestroV2",
    rabbitmq = "rabbitmq",
}

export class TaskConfigurationDtpItem extends dtpItem {
    private static readonly tasksIndex = "tasks";
    constructor(name: string = "", id: string = "", public tasks: Array<dtpItem> = [], public isCreatedOnServer: boolean = false) {
        super(isCreatedOnServer, id, name);
    }
    async toYamlObject(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            Promise.all(
                this.tasks.map(async (task) =>
                    task instanceof MaestroDtpItem ? await (task as MaestroDtpItem).toYamlObject() : task.toYamlObject()
                )
            )
                .then((tasks) => {
                    const yamlObj: any = {};
                    yamlObj.id = this.id;
                    yamlObj.name = this.name;
                    yamlObj[TaskConfigurationDtpItem.tasksIndex] = tasks;
                    resolve(yamlObj);
                })
                .catch((err) => reject(err));
        });
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            tasks: new FormArray(this.tasks.map((task) => task.toFormGroup())),
        });
    }

    public removeTasksFileLinks(mappingsFilePath: string, removeLinkedFile: boolean) {
        this.tasks.forEach((task) => {
            if (task instanceof MaestroDtpItem || task instanceof DataRepeaterDtpItem) {
                task.removeFileLinks(mappingsFilePath, removeLinkedFile);
            }
        });
    }

    static parse(yaml: any, mappingsFilePath: string, projectPath: string): TaskConfigurationDtpItem {
        let mappings: any;
        try {
            mappings = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: "utf8", flag: "r" }));
        } catch (ex) {
            mappings = {};
            console.warn(`Unable to parse path mappings from file at: '${mappingsFilePath}' due to: ${ex}`);
        } finally {
            const tasks: dtpItem[] =
                TaskConfigurationDtpItem.tasksIndex in yaml
                    ? yaml[TaskConfigurationDtpItem.tasksIndex].map((taskYamlObj: any) => {
                          if (DataRepeaterDtpItem.objectIdentifier in taskYamlObj) {
                              const id = taskYamlObj["id"];
                              let fmuPath: string = mappings[DataRepeaterDtpItem.datarepeaterMappingsIndex]?.[id] ?? "";
                              if (fmuPath) {
                                  // If path is not absolute then try relative to project.
                                  if (!Path.isAbsolute(fmuPath)) {
                                      fmuPath = Path.join(projectPath, fmuPath);
                                  }
                                  if (!fs.existsSync(fmuPath)) {
                                      console.warn(`Could not find linked data-repeater fmu in path: ${fmuPath}`);
                                  }
                              }

                              return DataRepeaterDtpItem.parse(taskYamlObj[DataRepeaterDtpItem.objectIdentifier], fmuPath, id);
                          } else if (MaestroDtpItem.objectIdentifier) {
                              const id = taskYamlObj["id"];
                              let coePath: string = mappings[MaestroDtpItem.coeMappingsIndex]?.[id] ?? "";
                              let mmPath: string = mappings[MaestroDtpItem.mmMappingsIndex]?.[id] ?? "";
                              // If the coe path exists so should the mm path.
                              if (coePath) {
                                  // If paths are not absolute then try relative to project.
                                  if (!Path.isAbsolute(coePath)) {
                                      coePath = Path.join(projectPath, coePath);
                                  }
                                  if (!Path.isAbsolute(mmPath)) {
                                      mmPath = Path.join(projectPath, mmPath);
                                  }
                                  if (!fs.existsSync(coePath)) {
                                      console.warn(`Could not load data from linked coe path: ${coePath}`);
                                  }
                                  if (!fs.existsSync(mmPath)) {
                                      console.warn(`Could not load data from linked multi-model path: ${mmPath}`);
                                  }
                              }
                              return MaestroDtpItem.parse(taskYamlObj, mmPath, coePath, id);
                          }
                      })
                    : [];
            return new TaskConfigurationDtpItem(yaml["name"], yaml["id"], tasks, true);
        }
    }
}

export class ToolDtpItem extends dtpItem {
    constructor(
        name: string = "",
        id: string = "",
        public path: string = "",
        public url: string = "",
        public type: ToolType = ToolType.maestroV2,
        public isCreatedOnServer: boolean = false
    ) {
        super(isCreatedOnServer, id, name);
    }

    toYamlObject(): {} {
        return { path: this.path, url: this.url, type: this.type, name: this.name };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            path: new FormControl(this.path, Validators.required),
            url: new FormControl(this.url),
            type: new FormControl(this.type, Validators.required),
        });
    }

    static parse(yaml: any, id: string): ToolDtpItem {
        return new ToolDtpItem(yaml["name"], id, yaml["path"], yaml["url"], yaml["type"], true);
    }
}

export class ServerDtpItem extends dtpItem {
    constructor(
        name: string = "",
        id: string = "",
        public username: string = "",
        public password: string = "",
        public host: string = "",
        public port: number = 5672,
        public embedded: boolean = true,
        public type: string = "",
        public isCreatedOnServer: boolean = false
    ) {
        super(isCreatedOnServer, id, name);
    }

    toYamlObject(): {} {
        return {
            name: this.name,
            user: this.username,
            password: this.password,
            host: this.host,
            port: this.port,
            type: this.type,
            embedded: this.embedded,
        };
    }
    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            type: new FormControl(this.type),
            username: new FormControl(this.username, Validators.required),
            password: new FormControl(this.password, Validators.required),
            host: new FormControl(this.host, Validators.required),
            port: new FormControl(this.port, [Validators.required, integerValidator]),
            embedded: new FormControl(this.embedded),
        });
    }

    static parse(yaml: any, id: string): ServerDtpItem {
        return new ServerDtpItem(
            yaml["name"],
            id,
            yaml["user"],
            yaml["password"],
            yaml["host"],
            yaml["port"],
            yaml["embedded"],
            yaml["type"],
            true
        );
    }
}

export class MaestroDtpItem extends dtpItem {
    public static readonly objectIdentifier: string = "simulation";
    public static readonly mmMappingsIndex = "multiModelPathMappings";
    public static readonly coeMappingsIndex = "coePathMappings";
    constructor(
        name: string = "",
        id: string = "",
        public multiModelPath: string = "",
        public coePath: string = "",
        public capture_output: boolean = false,
        public tool: string = "",
        public isCreatedOnServer: boolean = false
    ) {
        super(isCreatedOnServer, id, name);
    }

    public linkToCoeAndMMPath(mappingsFilePath: string) {
        const obj = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: "utf8", flag: "r" }));
        if (!obj[MaestroDtpItem.mmMappingsIndex]) {
            obj[MaestroDtpItem.mmMappingsIndex] = {};
        }
        if (!obj[MaestroDtpItem.coeMappingsIndex]) {
            obj[MaestroDtpItem.coeMappingsIndex] = {};
        }
        obj[MaestroDtpItem.mmMappingsIndex][this.id] = Path.basename(this.multiModelPath);
        obj[MaestroDtpItem.coeMappingsIndex][this.id] = Path.basename(this.coePath);
        fs.writeFile(mappingsFilePath, JSON.stringify(obj), (err) => {
            if (err) console.warn(err);
        });
    }

    public removeFileLinks(mappingsFilePath: string, removeLinkedFile: boolean) {
        const obj = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: "utf8", flag: "r" }));
        // If one of the mappings are not present the other is also missing..
        if (!obj[MaestroDtpItem.mmMappingsIndex]?.[this.id]) {
            return;
        }
        delete obj[MaestroDtpItem.coeMappingsIndex][this.id];
        delete obj[MaestroDtpItem.mmMappingsIndex][this.id];
        if (removeLinkedFile) {
            fs.unlink(this.multiModelPath, (err) => {
                if (err) console.warn(`Unable to delete mm file linked with maestro: ${err}`);
            });
            fs.unlink(this.coePath, (err) => {
                if (err) console.warn(`Unable to delete coe file linked with maestro: ${err}`);
            });
        }
        fs.writeFile(mappingsFilePath, JSON.stringify(obj), (err) => {
            if (err) console.warn("Unable to remove coe/mm link from mappings file: " + err);
        });
    }

    async toYamlObject() {
        let project = IntoCpsApp.getInstance().getActiveProject();
        const maestroYamlObj: any = {};
        let configObj: any = {};
        maestroYamlObj[MaestroDtpItem.objectIdentifier] = {
            name: this.name,
            execution: { tool: this.tool, capture_output: this.capture_output },
            prepare: { tool: this.tool },
        };
        maestroYamlObj.id = this.id;
        if (this.coePath) {
            const coeConfig: CoSimulationConfig = await CoSimulationConfig.parse(
                this.coePath,
                project.getRootFilePath(),
                project.getFmusPath()
            );
            // Insert absolute path to fmus
            const mmConfigObj = coeConfig.multiModel.toObject();
            coeConfig.multiModel.fmus.forEach(
                (fmu) =>
                    (mmConfigObj["fmus"][fmu.name] = (fmu.isNested() ? "coe:/" : "file:///" + fmu.path)
                        .replace(/\\/g, "/")
                        .replace(/ /g, "%20"))
            );
            configObj = Object.assign(coeConfig.toObject(), mmConfigObj);
        }
        maestroYamlObj[MaestroDtpItem.objectIdentifier].config = configObj;
        return maestroYamlObj;
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            capture_output: new FormControl(this.capture_output),
            tool: new FormControl(this.tool),
        });
    }

    static parse(yaml: any, mmPath: string, coePath: string, id: string): MaestroDtpItem {
        const maestroYamlObj = yaml[this.objectIdentifier];
        return new MaestroDtpItem(
            maestroYamlObj["name"],
            id,
            mmPath,
            coePath,
            maestroYamlObj["execution"]["capture_output"],
            maestroYamlObj["execution"]["tool"],
            true
        );
    }
}

export class SignalSource {
    constructor(public exchange: string = "exchange", public datatype: string = "double", public routing_key: string = "routing_key") {}

    toYamlObject() {
        return {
            exchange: this.exchange,
            datatype: this.datatype,
            routing_key: this.routing_key,
        };
    }
}

export class SignalTarget {
    constructor(
        public exchange: string = "exchange",
        public pack: string = "JSON",
        public path = "path",
        public datatype = "double",
        public routing_key = "routing_key"
    ) {}
    toYamlObject() {
        return {
            exchange: this.exchange,
            pack: this.pack,
            path: this.path,
            datatype: this.datatype,
            routing_key: this.routing_key,
        };
    }
}

export class SignalDtpType extends dtpItem {
    constructor(
        name: string = "",
        id: string = "",
        public source: SignalSource = new SignalSource(),
        public target: SignalTarget = new SignalTarget(),
        public isCreatedOnServer: boolean = false
    ) {
        super(isCreatedOnServer, id, name);
    }

    toYamlObject(): {} {
        return {
            name: this.name,
            source: this.source.toYamlObject(),
            target: this.target.toYamlObject(),
        };
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            source_exchange: new FormControl(this.source.exchange, Validators.required),
            source_datatype: new FormControl(this.source.datatype, Validators.required),
            source_routing_key: new FormControl(this.source.routing_key, Validators.required),
            target_exchange: new FormControl(this.target.exchange, Validators.required),
            target_datatype: new FormControl(this.target.datatype, Validators.required),
            target_routing_key: new FormControl(this.target.routing_key, Validators.required),
            target_pack: new FormControl(this.target.pack, Validators.required),
            target_path: new FormControl(this.target.path, Validators.required),
        });
    }

    static parse(yaml: any, id: string): SignalDtpType {
        return new SignalDtpType(
            yaml["name"],
            id,
            new SignalSource(yaml["source"]["exchange"], yaml["source"]["datatype"], yaml["source"]["routing_key"]),
            new SignalTarget(
                yaml["target"]["exchange"],
                yaml["target"]["pack"],
                yaml["target"]["path"],
                yaml["target"]["datatype"],
                yaml["target"]["routing_key"]
            ),
            true
        );
    }
}

export class DataRepeaterDtpItem extends dtpItem {
    public static readonly objectIdentifier: string = "amqp-repeater";
    public static readonly datarepeaterMappingsIndex = "dataRepeaterFmuMappings";
    constructor(
        name: string = "",
        id: string = "",
        public tool: string = "",
        public server_source: string = "",
        public server_target: string = "",
        public signals: Array<dtpItem> = [],
        public fmu_path: string = "",
        public isCreatedOnServer: boolean = false
    ) {
        super(isCreatedOnServer, id, name);
    }

    public addLinkToFMU(mappingsFilePath: string) {
        const obj = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: "utf8", flag: "r" }));
        if (!obj[DataRepeaterDtpItem.datarepeaterMappingsIndex]) {
            obj[DataRepeaterDtpItem.datarepeaterMappingsIndex] = {};
        }
        obj[DataRepeaterDtpItem.datarepeaterMappingsIndex][this.id] = Path.basename(this.fmu_path);
        fs.writeFile(mappingsFilePath, JSON.stringify(obj), (err) => {
            if (err) console.warn(err);
        });
    }

    public removeFileLinks(mappingsFilePath: string, removeLinkedFile: boolean) {
        const obj = JSON.parse(fs.readFileSync(mappingsFilePath, { encoding: "utf8", flag: "r" }));
        if (!obj[DataRepeaterDtpItem.datarepeaterMappingsIndex]?.[this.id]) {
            return;
        }
        delete obj[DataRepeaterDtpItem.datarepeaterMappingsIndex][this.id];
        if (removeLinkedFile) {
            fs.unlink(this.fmu_path, (err) => {
                if (err) console.warn(`Unable to delete fmu linked with datarepeater: ${err}`);
            });
        }
        fs.writeFile(mappingsFilePath, JSON.stringify(obj), (err) => {
            if (err) console.warn(err);
        });
    }

    toFormGroup() {
        return new FormGroup({
            name: new FormControl(this.name, Validators.required),
            server_source: new FormControl(this.server_source, Validators.required),
            server_target: new FormControl(this.server_target, Validators.required),
            signals: new FormArray(this.signals.map((signal) => signal.toFormGroup())),
            fmu_path: new FormControl(this.fmu_path),
            tool: new FormControl(this.tool, Validators.required),
        });
    }

    toYamlObject() {
        const signalsObj: any = {};
        this.signals.forEach((signal) => {
            const dtpSignal = signal as SignalDtpType;
            signalsObj[dtpSignal.id] = dtpSignal.toYamlObject();
        });
        const dataRepeaterObject: any = {};
        dataRepeaterObject[DataRepeaterDtpItem.objectIdentifier] = {
            name: this.name,
            prepare: { tool: this.tool },
            servers: { source: this.server_source, target: this.server_target },
            signals: signalsObj,
        };
        dataRepeaterObject.id = this.id;
        return dataRepeaterObject;
    }

    static parse(dataRepeaterYamlObj: any, fmuPath: string, id: string): DataRepeaterDtpItem {
        const signals: SignalDtpType[] = Object.keys(dataRepeaterYamlObj["signals"]).map((yamlSigKey: any) =>
            SignalDtpType.parse(dataRepeaterYamlObj["signals"][yamlSigKey], yamlSigKey)
        );
        return new DataRepeaterDtpItem(
            dataRepeaterYamlObj["name"],
            id,
            dataRepeaterYamlObj["prepare"]["tool"],
            dataRepeaterYamlObj["servers"]["source"],
            dataRepeaterYamlObj["servers"]["target"],
            signals,
            fmuPath,
            true
        );
    }
}
