import { Component, OnDestroy } from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import { Project } from "../../proj/Project";
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import { Reactivity, SigverConfiguration } from "../../intocps-configurations/sigver-configuration";
import { SigverConfigurationService } from "./sigver-configuration.service";
import { Subscription } from 'rxjs';
import { CoSimulationConfig, FixedStepAlgorithm, VariableStepAlgorithm } from "../../intocps-configurations/CoSimulationConfig";

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
        this._configurationChangedSub = this.sigverConfigurationService.configurationLoadedObservable.subscribe(() => {
            this.setViewModelItemsFromConfig();
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

        this.locateAndSetMMAndCoeFiles(mmFolderPath, coeFolderPath).then(() => this.setMultimodelFromPath(this.mmPath)).catch(err => { console.error(err) });

        this.simEnvParams = new SimulationEnvironmentParameters(
            this.sigverConfigurationService.configuration.coeConfig.global_relative_tolerance,
            this.sigverConfigurationService.configuration.coeConfig.global_absolute_tolerance,
            this.sigverConfigurationService.configuration.coeConfig.convergenceAttempts,
            this.sigverConfigurationService.configuration.coeConfig.startTime,
            this.sigverConfigurationService.configuration.coeConfig.endTime,
            this.sigverConfigurationService.configuration.coeConfig.algorithm.getStepSize()
        );
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
        this.locateAndSetMMAndCoeFiles(Path.join(experimentPath, ".."), Path.join(experimentPath)).then(() => {
            this.setMultimodelFromPath(this.mmPath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
    }

    onPriorExperimentPathChanged(experimentPath: string) {
        this.priorExperimentPath = experimentPath;
        this.usePriorExperiment = true;
        this.locateAndSetMMAndCoeFiles(Path.join(experimentPath), Path.join(experimentPath)).then(() => {
            this.setMultimodelFromPath(this.mmPath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
    }

    onReactivityChanged(key: string, reactivity: string) {
        this.portsToReactivity.set(key, Reactivity[reactivity as keyof typeof Reactivity]);
    }

    async onSubmit() {
        if (!this.editing) return;

        const updatedSigverConfiguration = new SigverConfiguration;

        // Set changes from the view models in the configuration
        updatedSigverConfiguration.experimentPath = this.experimentPath;
        updatedSigverConfiguration.masterModel = this.sigverConfigurationService.configuration.masterModel;
        updatedSigverConfiguration.priorExperimentPath = !this.usePriorExperiment ? "" : this.priorExperimentPath;
        updatedSigverConfiguration.reactivity = new Map(this.portsToReactivity);
        const relative = Path.relative(Path.dirname(this.sigverConfigurationService.configurationPath), this.coePath);
        const coeFileChanged = Path.basename(this.coePath) != relative;

        if(coeFileChanged) {
            await this.updateCoeFileInConfPath().then(async () => {
                updatedSigverConfiguration.coePath = this.coePath;
                let project = IntoCpsApp.getInstance().getActiveProject();

                await CoSimulationConfig.parse(this.coePath, project.getRootFilePath(), project.getFmusPath(), this.mmPath).then(coeConfig => {
                    updatedSigverConfiguration.coeConfig = coeConfig;
                })
            }).catch(err => console.warn(err));
        }
        updatedSigverConfiguration.coeConfig.convergenceAttempts = this.simEnvParams.convergenceAttempts;
        updatedSigverConfiguration.coeConfig.global_absolute_tolerance = this.simEnvParams.convergenceAbsoluteTolerance;
        updatedSigverConfiguration.coeConfig.global_relative_tolerance = this.simEnvParams.convergenceRelativeTolerance;
        updatedSigverConfiguration.coeConfig.endTime = this.simEnvParams.endTime;
        updatedSigverConfiguration.coeConfig.startTime = this.simEnvParams.startTime;

        if(updatedSigverConfiguration.coeConfig.algorithm instanceof FixedStepAlgorithm ){
            const algo = updatedSigverConfiguration.coeConfig.algorithm as FixedStepAlgorithm;
            algo.size = this.simEnvParams.stepSize;
        } else {
            const algo = updatedSigverConfiguration.coeConfig.algorithm as VariableStepAlgorithm;
            algo.initSize = this.simEnvParams.stepSize;
        }
        updatedSigverConfiguration.mmPath = this.mmPath;
        updatedSigverConfiguration.coePath = this.coePath;
        this.sigverConfigurationService.configuration = updatedSigverConfiguration;
        this.sigverConfigurationService.saveConfiguration();

        this.editing = false;
    }

    private updateCoeFileInConfPath(): Promise<void>  {
        return new Promise<void>((resolve, reject) => {
            fs.promises.readdir(Path.dirname(this.sigverConfigurationService.configurationPath)).then(filesInDir => {
                const existingCoeFile = filesInDir.find(fileName => fileName.toLowerCase().endsWith("coe.json"));
                if(existingCoeFile) {
                    fs.unlink(existingCoeFile, () => {
                        this.copyCoeToConfigPath().then(newCoePath => {
                            this.coePath = newCoePath;
                            resolve();
                        });

                    });
                } else {
                    this.copyCoeToConfigPath().then(newCoePath => {
                        this.coePath = newCoePath;
                        resolve();
                    });

                }
                
            }).catch(err => reject(err));
        });
    }

    private copyCoeToConfigPath(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const expName = this.experimentPath.split(Path.sep);

            const newCoeFileName = "sigver_" + expName[expName.length-2] + "_" + expName[expName.length-1]+ "_" + "cos.json";
            const destinationPath = Path.join(Path.dirname(this.sigverConfigurationService.configurationPath), newCoeFileName);
            fs.copyFile(this.coePath, destinationPath, (err) => {
                if (err) reject(err);
                resolve(destinationPath);
            });
        });
    }

    resetConfigurationOptionsViewElements() {
        // Set port reactivities to delayed
        let inputPorts: string[] = Object.values(this.multiModelConfig.toObject().connections as Map<string, string[]>).reduce((prevVal, currVal) => prevVal.concat(currVal), []);
        this.portsToReactivity = new Map(inputPorts.map(p => [p, Reactivity.Delayed]));

        this.sigverConfigurationService.configuration.coeConfig.global_absolute_tolerance

        this.simEnvParams.convergenceAbsoluteTolerance = this.sigverConfigurationService.configuration.coeConfig.global_absolute_tolerance;
        this.simEnvParams.convergenceRelativeTolerance = this.sigverConfigurationService.configuration.coeConfig.global_relative_tolerance;
        this.simEnvParams.convergenceAttempts = 5;
        this.simEnvParams.endTime = this.sigverConfigurationService.configuration.coeConfig.endTime;
        this.simEnvParams.startTime = this.sigverConfigurationService.configuration.coeConfig.startTime;
        this.simEnvParams.stepSize = this.sigverConfigurationService.configuration.coeConfig.algorithm.getStepSize();
    }

    locateAndSetMMAndCoeFiles(mmDir: string, coeDir: string): Promise<void> {
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
                            this.sigverConfigurationService.configurationPath

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

class SimulationEnvironmentParameters {
    constructor(
        public convergenceRelativeTolerance: number = 0,
        public convergenceAbsoluteTolerance: number = 0,
        public convergenceAttempts: number = 0,
        public startTime: number = 0,
        public endTime: number = 0,
        public stepSize: number = 0) {}
}