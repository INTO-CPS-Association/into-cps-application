import { Parser } from "./Parser";
import { MultiModelConfig } from "./MultiModelConfig";
import * as Path from 'path';

export class SvConfiguration {
    public extendedMultiModel: ExtendedMultiModel = new ExtendedMultiModel();
    public simulationEnvironmentParameters: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();
    public masterModel: string = "";
    public mmPath: string = "";
    public fmuRootPath: string = "";
    public experimentPath: string = "";
    public priorExperimentPath: string = "";

    public static readonly MMPATH_TAG: string = "mmPath";
    public static readonly FMUROOTPATH_TAG: string = "fmuRootPath";
    public static readonly MULTIMODEL_TAG: string = "multiModel";
    public static readonly EXECUTIONPARAMETERS_TAG: string = "executionParameters";
    public static readonly MASTERMODEL_TAG: string = "masterModel";
    public static readonly EXPERIMENTPATH_TAG: string = "experimentPath";
    public static readonly PRIOREXPERIMENTPATH_TAG: string = "priorExperimentPath";

    static createFromJsonString(jsonData: string): SvConfiguration {
        const jsonObj = JSON.parse(jsonData);

        const svConfiguration = new SvConfiguration();
        svConfiguration.mmPath = jsonObj[this.MMPATH_TAG];
        svConfiguration.fmuRootPath = jsonObj[this.FMUROOTPATH_TAG];

        const multiModelObj = jsonObj[this.MULTIMODEL_TAG];
        let parser = new Parser();
        svConfiguration.extendedMultiModel = new ExtendedMultiModel();

        parser.parseFmus(multiModelObj, Path.normalize(svConfiguration.fmuRootPath)).then(fmus => {
            svConfiguration.extendedMultiModel.fmus = fmus;
            parser.parseConnections(multiModelObj, svConfiguration.extendedMultiModel);
            parser.parseParameters(multiModelObj, svConfiguration.extendedMultiModel);
        });
        const scenarioVerifierObj = multiModelObj[ExtendedMultiModel.SCENARIOVERIFIER_TAG]
        svConfiguration.extendedMultiModel.verification = scenarioVerifierObj[ExtendedMultiModel.VERIFICIATION_TAG]
        svConfiguration.extendedMultiModel.reactivity = new Map(Object.entries(scenarioVerifierObj[ExtendedMultiModel.REACTIVITY_TAG]));

        svConfiguration.experimentPath = jsonObj[this.EXPERIMENTPATH_TAG];
        svConfiguration.priorExperimentPath = jsonObj[this.PRIOREXPERIMENTPATH_TAG];
        svConfiguration.masterModel = jsonObj[this.MASTERMODEL_TAG];

        const execParamObjs = jsonObj[this.EXECUTIONPARAMETERS_TAG];
        svConfiguration.simulationEnvironmentParameters = new SimulationEnvironmentParameters();
        svConfiguration.simulationEnvironmentParameters.convergenceAbsoluteTolerance = execParamObjs[SimulationEnvironmentParameters.ABSTOL_TAG];
        svConfiguration.simulationEnvironmentParameters.convergenceRelativeTolerance = execParamObjs[SimulationEnvironmentParameters.RELTOL_TAG];
        svConfiguration.simulationEnvironmentParameters.convergenceAttempts = execParamObjs[SimulationEnvironmentParameters.CONVATT_TAG];
        svConfiguration.simulationEnvironmentParameters.endTime = execParamObjs[SimulationEnvironmentParameters.ENDTIME_TAG];
        svConfiguration.simulationEnvironmentParameters.startTime = execParamObjs[SimulationEnvironmentParameters.STARTTIME_TAG];
        svConfiguration.simulationEnvironmentParameters.stepSize = execParamObjs[SimulationEnvironmentParameters.STEPSIZE_TAG];

        return svConfiguration;
    }

    serializeToJsonString(): string {
        const dtoObj = this.toDTO();
        dtoObj[SvConfiguration.MMPATH_TAG] = this.mmPath;
        dtoObj[SvConfiguration.FMUROOTPATH_TAG] = this.fmuRootPath;
        dtoObj[SvConfiguration.EXPERIMENTPATH_TAG] = this.experimentPath;
        dtoObj[SvConfiguration.PRIOREXPERIMENTPATH_TAG] = this.priorExperimentPath;
        return JSON.stringify(dtoObj);
    }


    toDTO(): any {
        return {
            multiModel: this.extendedMultiModel.toExtendedMultiModelObject(),
            executionParameters: this.simulationEnvironmentParameters.toDTO(),
            masterModel: this.masterModel
        }
    }
}

export class ExtendedMultiModel extends MultiModelConfig {
    public static readonly SCENARIOVERIFIER_TAG: string = "scenarioVerifier";
    public static readonly REACTIVITY_TAG: string = "reactivity";
    public static readonly VERIFICIATION_TAG: string = "verification";

    public reactivity: Map<string, Reactivity> = new Map();
    public verification: boolean = false;

    toExtendedMultiModelObject() {
        const mm = this.toObject();

        const reactivity: { [key: string]: Reactivity } = {};

        this.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));

        mm[ExtendedMultiModel.SCENARIOVERIFIER_TAG] = {
            reactivity: reactivity,
            verification: this.verification
        };

        return mm;
    }
}

export class SimulationEnvironmentParameters {
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

    toDTO(): any {
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