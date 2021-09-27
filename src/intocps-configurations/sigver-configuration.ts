import { Parser } from "./Parser";
import { MultiModelConfig } from "./MultiModelConfig";
import * as Path from 'path';

export class SigverConfiguration implements ISerializable {
    public multiModel: MultiModelConfig = new MultiModelConfig();
    public simulationEnvironmentParameters: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();
    public masterModel: string = "";
    public fmuRootPath: string = "";
    public experimentPath: string = "";
    public priorExperimentPath: string = "";
    public reactivity: Map<string, Reactivity> = new Map();

    public static readonly FMUROOTPATH_TAG: string = "fmuRootPath";
    public static readonly MULTIMODEL_TAG: string = "multiModel";
    public static readonly EXECUTIONPARAMETERS_TAG: string = "executionParameters";
    public static readonly MASTERMODEL_TAG: string = "masterModel";
    public static readonly EXPERIMENTPATH_TAG: string = "experimentPath";
    public static readonly PRIOREXPERIMENTPATH_TAG: string = "priorExperimentPath";
    public static readonly SIGVER_TAG: string = "sigver";
    public static readonly REACTIVITY_TAG: string = "reactivity";

    static async createFromJsonString(savedData: string): Promise<SigverConfiguration> {
        return new Promise<SigverConfiguration>((resolve, reject) => {
            const sigverConfiguration = new SigverConfiguration();
            if(savedData == "{}"){
                resolve(sigverConfiguration);
            }
            try{
                const jsonObj = JSON.parse(savedData);

                sigverConfiguration.fmuRootPath = jsonObj[this.FMUROOTPATH_TAG];
    
                const multiModelObj = jsonObj[this.MULTIMODEL_TAG];
                let parser = new Parser();
                sigverConfiguration.reactivity = new Map(Object.entries(jsonObj[SigverConfiguration.REACTIVITY_TAG]));
    
                sigverConfiguration.experimentPath = jsonObj[this.EXPERIMENTPATH_TAG];
                sigverConfiguration.priorExperimentPath = jsonObj[this.PRIOREXPERIMENTPATH_TAG];
                sigverConfiguration.masterModel = jsonObj[this.MASTERMODEL_TAG];
    
                const execParamObjs = jsonObj[this.EXECUTIONPARAMETERS_TAG];
                sigverConfiguration.simulationEnvironmentParameters = new SimulationEnvironmentParameters();
                sigverConfiguration.simulationEnvironmentParameters.convergenceAbsoluteTolerance = execParamObjs[SimulationEnvironmentParameters.ABSTOL_TAG];
                sigverConfiguration.simulationEnvironmentParameters.convergenceRelativeTolerance = execParamObjs[SimulationEnvironmentParameters.RELTOL_TAG];
                sigverConfiguration.simulationEnvironmentParameters.convergenceAttempts = execParamObjs[SimulationEnvironmentParameters.CONVATT_TAG];
                sigverConfiguration.simulationEnvironmentParameters.endTime = execParamObjs[SimulationEnvironmentParameters.ENDTIME_TAG];
                sigverConfiguration.simulationEnvironmentParameters.startTime = execParamObjs[SimulationEnvironmentParameters.STARTTIME_TAG];
                sigverConfiguration.simulationEnvironmentParameters.stepSize = execParamObjs[SimulationEnvironmentParameters.STEPSIZE_TAG];
    
                parser.parseFmus(multiModelObj, Path.normalize(sigverConfiguration.fmuRootPath)).then(async fmus => {
                    sigverConfiguration.multiModel.fmus = fmus;
                    parser.parseConnections(multiModelObj, sigverConfiguration.multiModel);
                    parser.parseParameters(multiModelObj, sigverConfiguration.multiModel);
                    resolve(sigverConfiguration);
                }).catch(err => reject(err));
            }
            catch(ex){
                reject(`Unable parse the configuration: ${ex}`);
            }
        })
    }

    toJsonString(): string{
        return JSON.stringify(this.toObject());
    }

    toObject(): object {
        const objToReturn: any = {}
        const mmObject = this.multiModel.toObject();
        const reactivity: { [key: string]: Reactivity } = {};
        this.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));
        
        objToReturn[SigverConfiguration.MASTERMODEL_TAG] = this.masterModel;
        objToReturn[SigverConfiguration.EXECUTIONPARAMETERS_TAG] = this.simulationEnvironmentParameters.toObject();
        objToReturn[SigverConfiguration.MULTIMODEL_TAG] = mmObject;
        objToReturn[SigverConfiguration.FMUROOTPATH_TAG] = this.fmuRootPath;
        objToReturn[SigverConfiguration.EXPERIMENTPATH_TAG] = this.experimentPath;
        objToReturn[SigverConfiguration.PRIOREXPERIMENTPATH_TAG] = this.priorExperimentPath;
        objToReturn[SigverConfiguration.REACTIVITY_TAG] = reactivity;
        return objToReturn;
    }
}

export class SimulationEnvironmentParameters implements ISerializable {
    public static readonly RELTOL_TAG: string = "convergenceRelativeTolerance";
    public static readonly ABSTOL_TAG: string = "convergenceAbsoluteTolerance";
    public static readonly CONVATT_TAG: string = "convergenceAttempts";
    public static readonly STARTTIME_TAG: string = "startTime";
    public static readonly ENDTIME_TAG: string = "endTime";
    public static readonly STEPSIZE_TAG: string = "stepSize";
    public convergenceRelativeTolerance: number = 0;
    public convergenceAbsoluteTolerance: number = 0;
    public convergenceAttempts: number = 0;
    public startTime: number = 0;
    public endTime: number = 0;
    public stepSize: number = 0;

    toObject(): any {
        let simEnVParams: any = {};
        simEnVParams[SimulationEnvironmentParameters.RELTOL_TAG] = this.convergenceRelativeTolerance;
        simEnVParams[SimulationEnvironmentParameters.ABSTOL_TAG] = this.convergenceAbsoluteTolerance;
        simEnVParams[SimulationEnvironmentParameters.CONVATT_TAG] = this.convergenceAttempts;
        simEnVParams[SimulationEnvironmentParameters.STARTTIME_TAG] = this.startTime;
        simEnVParams[SimulationEnvironmentParameters.ENDTIME_TAG] = this.endTime;
        simEnVParams[SimulationEnvironmentParameters.STEPSIZE_TAG] = this.stepSize;
        return simEnVParams;
    }
}

// Represents a ports reactivity
export enum Reactivity {
    Delayed = 'Delayed',
    Reactive = 'Reactive'
}