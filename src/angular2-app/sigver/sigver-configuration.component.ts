import {Component, OnDestroy} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import {Project} from "../../proj/Project";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import { SimulationEnvironmentParameters, Reactivity, SigverConfiguration} from "../../intocps-configurations/sigver-configuration";
import { SigverConfigurationService } from "./sigver-configuration.service";
import { Subscription } from 'rxjs';

@Component({
    selector: "sigver-configuration",
    templateUrl: "./angular2-app/sigver/sigver-configuration.component.html"
})
export class SigverConfigurationComponent implements OnDestroy{
    private readonly noPath = "";
    private mmPath: string = "";
    private coePath: string = "";
    private readonly mmFileName = "mm.json";
    private readonly coeFileName = "coe.json";
    private _configurationChangedSub: Subscription;

    reactivityKeys = Object.keys(Reactivity);
    editing: boolean = false;
    usePriorExperiment: boolean = false;
    cantLocatePriorExperiment = false;
    experimentPath: string = this.noPath;
    priorExperimentPath: string = this.noPath;
    experimentsPaths: string [] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));
    priorExperimentsPaths: string [] = [];
    isMMWarnings: boolean = false;
    mMWarnings: string[] = [];
    multiModelConfig: MultiModelConfig;
    portsToReactivity: Map<string, Reactivity> = new Map();

    simEnvParams: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();

    constructor(private sigverConfigurationService: SigverConfigurationService){
        this._configurationChangedSub = this.sigverConfigurationService.configurationChangedObservable.subscribe(() => {
            this.setViewModelItemsFromConfig();
            this.validateMultiModel();
        });
    }

    ngOnDestroy(): void {
        this._configurationChangedSub.unsubscribe();
    }

    setViewModelItemsFromConfig() {
        this.experimentPath = this.sigverConfigurationService.configuration.experimentPath;
        let coeFolderPath = this.experimentPath;
        let mmFolderPath = Path.join(this.experimentPath, "..")
        this.usePriorExperiment = this.sigverConfigurationService.configuration.priorExperimentPath != "";
        if(this.experimentPath != ""){
            this.loadPriorExperimentsPaths();
        }
        if(this.usePriorExperiment){
            this.priorExperimentPath = this.sigverConfigurationService.configuration.priorExperimentPath;
            this.cantLocatePriorExperiment = this.priorExperimentsPaths.findIndex(p => p.includes(this.priorExperimentPath)) == -1;
            coeFolderPath = this.priorExperimentPath;
            mmFolderPath = this.priorExperimentPath;
        }

        let mmPath = Path.join(mmFolderPath, this.mmFileName)
        let coePath = Path.join(coeFolderPath, this.coeFileName)

        if(!this.isValidFilePath(coeFolderPath)){
            this.coePath = coePath;
        }

        if(this.isValidFilePath(mmPath)){
            this.mmPath = mmPath;
            this.setMultimodelFromPath(this.mmPath);
        }
        
        this.simEnvParams = Object.assign(new SimulationEnvironmentParameters() , this.sigverConfigurationService.configuration.simulationEnvironmentParameters);
        this.portsToReactivity = new Map(this.sigverConfigurationService.configuration.reactivity);
    }

    setMultimodelFromPath(mmPath : string): Promise<void> {
        let project = IntoCpsApp.getInstance().getActiveProject();
        return new Promise<void>((resolve, reject) => {
            MultiModelConfig
            .parse(mmPath, project.getFmusPath()).then((multiModel: MultiModelConfig) => {
                this.multiModelConfig = multiModel;
                resolve();
            }, err => {
                console.error(`Error during parsing of config: ${err}`)
                reject();
            });
         });
    }

    getExperimentNameFromPath(path: string, depth: number): string{
        let elems = path.split(Path.sep);
        if(elems.length <= 1) {
            return path;
        }
        let pathToReturn = "";
        for(let i = depth; i >= 1; i--){
            pathToReturn += elems[elems.length-i] + (i == 1 ? "" : " | ");
        }
        return pathToReturn;
    }

    getExperimentsPaths(path: string): string[] {
        let experimentPaths: string[] = []
        let files = fs.readdirSync(path);
        if(files.findIndex(f => f.endsWith("coe.json")) != -1){
            experimentPaths.push(path);
        }
        else {
            for(let i in files){
                let fileName = Path.join(path, files[i]);   
                if (fs.statSync(fileName).isDirectory()){
                    experimentPaths = experimentPaths.concat(this.getExperimentsPaths(fileName));
                }
            }
        }
        return experimentPaths;
    }

    getNameOfSelectedExperiment(): string {
        return this.getExperimentNameFromPath(this.usePriorExperiment ? this.priorExperimentPath : this.experimentPath, this.usePriorExperiment ? 3 : 2);
    }

    onExperimentPathChanged(experimentPath: string) {
        this.loadPriorExperimentsPaths();
        this.experimentPath = experimentPath;
        this.usePriorExperiment = false;
        this.priorExperimentPath = this.noPath;
        this.cantLocatePriorExperiment = false;
        this.handleExperimentPathChanged(Path.join(experimentPath, "..", this.mmFileName), Path.join(experimentPath, this.coeFileName)).then(() => {
            this.resetConfigurationOptionsViewElements();
        });
    }

    onPriorExperimentPathChanged(experimentPath: string) {
        this.priorExperimentPath = experimentPath;
        this.usePriorExperiment = true;
        this.handleExperimentPathChanged(Path.join(experimentPath, this.mmFileName), Path.join(experimentPath, this.coeFileName)).then(() => {
            this.resetConfigurationOptionsViewElements();
        });
    }

    onReactivityChanged(key: string, reactivity: string) {
        this.portsToReactivity.set(key, Reactivity[reactivity as keyof typeof Reactivity]);
    }

    onSubmit() {
        if (!this.editing) return;

        const updatedSigverConfiguration = new SigverConfiguration;

        // Set changes from the view models in the configuration
        updatedSigverConfiguration.experimentPath = this.experimentPath;
        updatedSigverConfiguration.fmuRootPath = IntoCpsApp.getInstance().getActiveProject().getFmusPath();
        updatedSigverConfiguration.masterModel = this.sigverConfigurationService.configuration.masterModel;
        updatedSigverConfiguration.priorExperimentPath = !this.usePriorExperiment ? this.noPath : this.priorExperimentPath;
        updatedSigverConfiguration.simulationEnvironmentParameters = Object.assign(new SimulationEnvironmentParameters() , this.simEnvParams);
        updatedSigverConfiguration.multiModel.sourcePath = this.multiModelConfig.sourcePath;
        updatedSigverConfiguration.multiModel.fmusRootPath = this.multiModelConfig.fmusRootPath;
        updatedSigverConfiguration.multiModel.fmus = Object.assign([], this.multiModelConfig.fmus);
        updatedSigverConfiguration.multiModel.fmuInstances = Object.assign([], this.multiModelConfig.fmuInstances);
        updatedSigverConfiguration.multiModel.instanceScalarPairs = Object.assign([], this.multiModelConfig.instanceScalarPairs);
        updatedSigverConfiguration.reactivity = new Map(this.portsToReactivity);

        this.sigverConfigurationService.configuration = updatedSigverConfiguration;
        this.validateMultiModel();

        this.editing = false;
    }

    isValidFilePath(path: string): boolean {
        if(!fs.existsSync(path)) {
            return false;
        }
        return true;
    }

    resetConfigurationOptionsViewElements() {
        // Set port reactivities to delayed
        let inputPorts: string[] = Object.values(this.multiModelConfig.toObject().connections as Map<string, string[]>).reduce((prevVal, currVal) => prevVal.concat(currVal), []);
        this.portsToReactivity = new Map(inputPorts.map(p => [p, Reactivity.Delayed]));
        
        // Set environment parameters from the coe json file
        fs.readFile(this.coePath, (error, data) => {
            if (error){
                console.error(`Unable to read coe file and set simulation environment parameters: ${error}`)
            }
            else{
                const jsonObj = JSON.parse(data.toString());
                this.simEnvParams.convergenceAbsoluteTolerance = jsonObj["global_absolute_tolerance"];
                this.simEnvParams.convergenceRelativeTolerance = jsonObj["global_relative_tolerance"];
                this.simEnvParams.convergenceAttempts = 5;
                this.simEnvParams.endTime = jsonObj["endTime"];
                this.simEnvParams.startTime = jsonObj["startTime"];
                this.simEnvParams.stepSize = jsonObj["algorithm"]["type"] == "fixed-step" ? jsonObj["algorithm"]["size"] : jsonObj["algorithm"]["initsize"];
            }
        });
    }

    handleExperimentPathChanged(newMMPath: string, newCoePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(this.isValidFilePath(newMMPath)){
                this.mmPath = newMMPath;
                this.setMultimodelFromPath(this.mmPath).then(() => {
                    if(this.isValidFilePath(newCoePath)){
                        this.coePath = newCoePath;
                        resolve();
                    }
                    else {
                        console.error("Unable to locate coe file at: " + newCoePath);
                        reject();
                    }
                }, reason => {
                    console.error(`${reason}`)
                });
            }
            else {
                console.error("Unable to locate multi model file at: " + newMMPath);
                reject();
            }
        });
    }

    validateMultiModel(){
        this.mMWarnings = this.sigverConfigurationService.configuration.multiModel.validate().map(w => w.message);
        this.isMMWarnings = this.mMWarnings.length > 0;
    }

    loadPriorExperimentsPaths() {
        let priorExperimentsPaths: string[] = []
        let files = fs.readdirSync(this.experimentPath);
        for(let i in files){
            let fileName = Path.join(this.experimentPath, files[i]);   
            if (fs.statSync(fileName).isDirectory()){
                priorExperimentsPaths = priorExperimentsPaths.concat(this.getExperimentsPaths(fileName));
            }
        }
        this.priorExperimentsPaths = priorExperimentsPaths;
    }
}