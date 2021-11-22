import { IntoCpsApp } from "../IntoCpsApp";
import { CoSimulationConfig } from "./CoSimulationConfig";

export class SigverConfiguration implements ISerializable {
    public masterModel: string = "";
    public experimentPath: string = "";
    public priorExperimentPath: string = "";
    public reactivity: Map<string, Reactivity> = new Map();
    public coeConfig: CoSimulationConfig = new CoSimulationConfig();
    public coePath: string = "";

    public static readonly COEPATH_TAG: string = "coePath";
    public static readonly MASTERMODEL_TAG: string = "masterModel";
    public static readonly EXPERIMENTPATH_TAG: string = "experimentPath";
    public static readonly PRIOREXPERIMENTPATH_TAG: string = "priorExperimentPath";
    public static readonly REACTIVITY_TAG: string = "reactivity";

    static async parse(jsonObj: any): Promise<SigverConfiguration> {
        return new Promise<SigverConfiguration>((resolve, reject) => {
            const sigverConfiguration = new SigverConfiguration();
            if(jsonObj == undefined || Object.keys(jsonObj).length == 0){
                resolve(sigverConfiguration);
            } else {
                try{
                    sigverConfiguration.reactivity = new Map(Object.entries(jsonObj[SigverConfiguration.REACTIVITY_TAG]));
                    sigverConfiguration.experimentPath = jsonObj[this.EXPERIMENTPATH_TAG];
                    sigverConfiguration.priorExperimentPath = jsonObj[this.PRIOREXPERIMENTPATH_TAG];
                    sigverConfiguration.masterModel = jsonObj[this.MASTERMODEL_TAG];
                    sigverConfiguration.coePath = jsonObj[this.COEPATH_TAG];
                    const project = IntoCpsApp.getInstance().getActiveProject();
                        CoSimulationConfig.parse(sigverConfiguration.coePath, project.getRootFilePath(), project.getFmusPath()).then(config => {
                            sigverConfiguration.coeConfig = config;
                            resolve(sigverConfiguration);
                        });
                }
                catch(ex){
                    reject(`Unable parse the configuration: ${ex}`);
                }
            }
        });
    }

    toObject(): object {
        const objToReturn: any = {}
        const reactivity: { [key: string]: Reactivity } = {};
        this.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));
        
        objToReturn[SigverConfiguration.MASTERMODEL_TAG] = this.masterModel;
        objToReturn[SigverConfiguration.EXPERIMENTPATH_TAG] = this.experimentPath;
        objToReturn[SigverConfiguration.PRIOREXPERIMENTPATH_TAG] = this.priorExperimentPath;
        objToReturn[SigverConfiguration.REACTIVITY_TAG] = reactivity;
        objToReturn[SigverConfiguration.COEPATH_TAG] = this.coePath;
        return objToReturn;
    }
}

// Represents a ports reactivity
export enum Reactivity {
    Delayed = 'Delayed',
    Reactive = 'Reactive'
}