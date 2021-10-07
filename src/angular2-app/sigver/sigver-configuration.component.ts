import { Component, OnDestroy } from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import { Project } from "../../proj/Project";
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import { SimulationEnvironmentParameters, Reactivity, SigverConfiguration } from "../../intocps-configurations/sigver-configuration";
import { SigverConfigurationService } from "./sigver-configuration.service";
import { Subscription } from 'rxjs';

@Component({
    selector: "sigver-configuration",
    templateUrl: "./angular2-app/sigver/sigver-configuration.component.html"
})
export class SigverConfigurationComponent implements OnDestroy {
    private mmPath: string = "";
    private coePath: string = "";
    private _configurationChangedSub: Subscription;

    reactivityKeys = Object.keys(Reactivity);
    editing: boolean = false;
    usePriorExperiment: boolean = false;
    cantLocatePriorExperiment = false;
    experimentPath: string = "";
    priorExperimentPath: string = "";
    experimentsPaths: string[] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));
    priorExperimentsPaths: string[] = [];
    isMMWarnings: boolean = false;
    mMWarnings: string[] = [];
    multiModelConfig: MultiModelConfig;
    portsToReactivity: Map<string, Reactivity> = new Map();

    simEnvParams: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();

    constructor(private sigverConfigurationService: SigverConfigurationService) {
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
        let mmFolderPath = this.experimentPath != "" ? Path.join(this.experimentPath, "..") : "";
        this.usePriorExperiment = this.sigverConfigurationService.configuration.priorExperimentPath != "";
        if (this.experimentPath != "") {
            this.loadPriorExperimentsPaths();
        }
        if (this.usePriorExperiment) {
            this.priorExperimentPath = this.sigverConfigurationService.configuration.priorExperimentPath;
            this.cantLocatePriorExperiment = this.priorExperimentsPaths.findIndex(p => p.includes(this.priorExperimentPath)) == -1;
            coeFolderPath = this.priorExperimentPath;
            mmFolderPath = this.priorExperimentPath;
        }

        this.locateMMAndCoeFiles(mmFolderPath, coeFolderPath).then(() => this.setMultimodelFromPath(this.mmPath)).catch(err => { console.error(err) });

        this.simEnvParams = Object.assign(new SimulationEnvironmentParameters(), this.sigverConfigurationService.configuration.simulationEnvironmentParameters);
        this.portsToReactivity = new Map(this.sigverConfigurationService.configuration.reactivity);
    }

    setMultimodelFromPath(mmPath: string): Promise<void> {
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

    getExperimentNameFromPath(path: string, depth: number): string {
        let elems = path.split(Path.sep);
        if (elems.length <= 1) {
            return path;
        }
        let pathToReturn = "";
        for (let i = depth; i >= 1; i--) {
            pathToReturn += elems[elems.length - i] + (i == 1 ? "" : " | ");
        }
        return pathToReturn;
    }

    getExperimentsPaths(path: string): string[] {
        let experimentPaths: string[] = []
        let files = fs.readdirSync(path);
        if (files.findIndex(f => f.endsWith("coe.json")) != -1) {
            experimentPaths.push(path);
        }
        else {
            for (let i in files) {
                let fileName = Path.join(path, files[i]);
                if (fs.statSync(fileName).isDirectory()) {
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
        this.priorExperimentPath = "";
        this.cantLocatePriorExperiment = false;
        this.locateMMAndCoeFiles(Path.join(experimentPath, ".."), Path.join(experimentPath)).then(() => {
            this.setMultimodelFromPath(this.mmPath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
    }

    onPriorExperimentPathChanged(experimentPath: string) {
        this.priorExperimentPath = experimentPath;
        this.usePriorExperiment = true;
        this.locateMMAndCoeFiles(Path.join(experimentPath), Path.join(experimentPath)).then(() => {
            this.setMultimodelFromPath(this.mmPath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
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
        updatedSigverConfiguration.priorExperimentPath = !this.usePriorExperiment ? "" : this.priorExperimentPath;
        updatedSigverConfiguration.simulationEnvironmentParameters = Object.assign(new SimulationEnvironmentParameters(), this.simEnvParams);
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

    resetConfigurationOptionsViewElements() {
        // Set port reactivities to delayed
        let inputPorts: string[] = Object.values(this.multiModelConfig.toObject().connections as Map<string, string[]>).reduce((prevVal, currVal) => prevVal.concat(currVal), []);
        this.portsToReactivity = new Map(inputPorts.map(p => [p, Reactivity.Delayed]));

        // Set environment parameters from the coe json file
        fs.readFile(this.coePath, (error, data) => {
            if (error) {
                console.error(`Unable to read coe file and set simulation environment parameters: ${error}`)
            }
            else {
                const jsonObj = JSON.parse(data.toString());
                this.simEnvParams.convergenceAbsoluteTolerance = jsonObj["global_absolute_tolerance"] ?? 0;
                this.simEnvParams.convergenceRelativeTolerance = jsonObj["global_relative_tolerance"] ?? 0;
                this.simEnvParams.convergenceAttempts = 5;
                this.simEnvParams.endTime = jsonObj["endTime"] ?? 0;
                this.simEnvParams.startTime = jsonObj["startTime"] ?? 0;
                this.simEnvParams.stepSize = (jsonObj["algorithm"]["type"] == "fixed-step" ? jsonObj["algorithm"]["size"] : jsonObj["algorithm"]["initsize"]) ?? 0;
            }
        });
    }

    locateMMAndCoeFiles(mmDir: string, coeDir: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!fs.existsSync(mmDir) || !fs.lstatSync(mmDir).isDirectory()) {
                reject(`"${mmDir}" is not a valid directory`)
            }
            if (!fs.existsSync(coeDir) || !fs.lstatSync(coeDir).isDirectory()) {
                reject(`"${coeDir}" is not a valid directory`)
            }
            fs.promises.readdir(mmDir).then(filesInMMDir => {
                var mmFileName = filesInMMDir.find(fileName => fileName.toLowerCase().endsWith("mm.json"));
                if (mmFileName) {
                    this.mmPath = Path.join(mmDir, mmFileName);
                    fs.promises.readdir(coeDir).then(filesInCOEDir => {
                        var coeFileName = filesInCOEDir.find(fileName => fileName.toLowerCase().endsWith("coe.json"));
                        if (coeFileName) {
                            this.coePath = Path.join(coeDir, coeFileName);
                            resolve();
                        } else {
                            reject("Unable to locate coe file in directory: " + coeDir);
                        }

                    }).catch(err => reject(err));
                } else {
                    reject("Unable to locate multi model file in directory: " + mmDir);
                }
            }).catch(err => reject(err));
        });
    }


    validateMultiModel() {
        this.mMWarnings = this.sigverConfigurationService.configuration.multiModel.validate().map(w => w.message);
        this.isMMWarnings = this.mMWarnings.length > 0;
    }

    loadPriorExperimentsPaths() {
        let priorExperimentsPaths: string[] = []
        let files = fs.readdirSync(this.experimentPath);
        for (let i in files) {
            let fileName = Path.join(this.experimentPath, files[i]);
            if (fs.statSync(fileName).isDirectory()) {
                priorExperimentsPaths = priorExperimentsPaths.concat(this.getExperimentsPaths(fileName));
            }
        }
        this.priorExperimentsPaths = priorExperimentsPaths;
    }
}