import { Component, OnDestroy } from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as Fs from 'fs';
import * as FsE from 'fs-extra';
import { Project } from "../../proj/Project";
import { Reactivity, SigverConfiguration } from "../../intocps-configurations/sigver-configuration";
import { SigverConfigurationService } from "./sigver-configuration.service";
import { Subscription } from 'rxjs';
import { CoSimulationConfig, FixedStepAlgorithm, VariableStepAlgorithm } from "../../intocps-configurations/CoSimulationConfig";

@Component({
    selector: "sigver-configuration",
    templateUrl: "./angular2-app/sigver/sigver-configuration.component.html"
})
export class SigverConfigurationComponent implements OnDestroy {
    private coePath: string = "";
    private _configurationLoadedSub: Subscription;

    reactivityKeys = Object.keys(Reactivity);
    editing: boolean = false;
    usePriorExperiment: boolean = false;
    cantLocatePriorExperiment = false;
    experimentPath: string = "";
    priorExperimentPath: string = "";
    experimentsPaths: string[] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));
    priorExperimentsPaths: string[] = [];
    coeConfig: CoSimulationConfig;
    portsToReactivity: Map<string, Reactivity> = new Map();
    simEnvParams: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();

    constructor(private sigverConfigurationService: SigverConfigurationService) {
        this._configurationLoadedSub = this.sigverConfigurationService.configurationLoadedObservable.subscribe(() => {
            this.setViewModelItemsFromConfig();
        });
    }

    ngOnDestroy(): void {
        this._configurationLoadedSub.unsubscribe();
    }

    setViewModelItemsFromConfig() {
        // Set view element values from the configuration
        this.experimentPath = this.sigverConfigurationService.configuration.experimentPath;
        let coeFolderPath = this.experimentPath;
        this.usePriorExperiment = this.sigverConfigurationService.configuration.priorExperimentPath != "";

        if (this.experimentPath != "") {
            this.loadPriorExperimentsPaths();
        }

        if (this.usePriorExperiment) {
            this.priorExperimentPath = this.sigverConfigurationService.configuration.priorExperimentPath;
            this.cantLocatePriorExperiment = this.priorExperimentsPaths.findIndex(p => p.includes(this.priorExperimentPath)) == -1;
            coeFolderPath = this.priorExperimentPath;
        }

        if(coeFolderPath){
            this.locateAndsetCoePath(coeFolderPath).then(() => this.parseAndSetCoeConfig(this.coePath)).catch(err => { console.error(err) });
        }

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

    parseAndSetCoeConfig(coePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const project = IntoCpsApp.getInstance().getActiveProject();
            CoSimulationConfig.parse(coePath, project.getRootFilePath(), project.getFmusPath()).then(coeConf => {
                this.coeConfig = coeConf;
                resolve();
            }, err => {
                console.error(`Error during parsing of coe config: ${err}`)
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
        const files = Fs.readdirSync(path);
        const coeFileName = files.find(f => f.endsWith("coe.json"));
        if (coeFileName && FsE.readJsonSync(Path.join(path, coeFileName)).algorithm.type != "var-step") {
            experimentPaths.push(path);
        }
        else {
            for (let i in files) {
                let fileName = Path.join(path, files[i]);
                if (Fs.statSync(fileName).isDirectory()) {
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
        this.locateAndsetCoePath(experimentPath).then(() => {
            this.parseAndSetCoeConfig(this.coePath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
    }

    onPriorExperimentPathChanged(experimentPath: string) {
        this.priorExperimentPath = experimentPath;
        this.usePriorExperiment = true;
        this.locateAndsetCoePath(experimentPath).then(() => {
            this.parseAndSetCoeConfig(this.coePath).then(() =>
                this.resetConfigurationOptionsViewElements());
        }).catch(err => console.error(err));
    }

    onReactivityChanged(key: string, reactivity: string) {
        this.portsToReactivity.set(key, Reactivity[reactivity as keyof typeof Reactivity]);
    }

    async onSubmit() {
        if (!this.editing) return;

        const updatedSigverConfiguration = new SigverConfiguration;

        // Set changes from the view models in a new configuration
        updatedSigverConfiguration.experimentPath = this.experimentPath;
        updatedSigverConfiguration.masterModel = this.sigverConfigurationService.configuration.masterModel;
        updatedSigverConfiguration.priorExperimentPath = !this.usePriorExperiment ? "" : this.priorExperimentPath;
        updatedSigverConfiguration.reactivity = new Map(this.portsToReactivity);
        const relative = Path.relative(Path.dirname(this.sigverConfigurationService.configurationPath), this.coePath);
        const coeFileChanged = Path.basename(this.coePath) != relative;

        if(coeFileChanged) {
            await this.updateCoeFileInConfPath().then(async () => {
                updatedSigverConfiguration.coePath = this.coePath;
                const project = IntoCpsApp.getInstance().getActiveProject();

                await CoSimulationConfig.parse(this.coePath, project.getRootFilePath(), project.getFmusPath()).then(coeConfig => {
                    updatedSigverConfiguration.coeConfig = coeConfig;
                })
            }).catch(err => console.warn(err));
        }
        else {
            updatedSigverConfiguration.coeConfig = this.sigverConfigurationService.configuration.coeConfig;
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
        updatedSigverConfiguration.coePath = this.coePath;

        //Update and save the configuration - this also triggers a configuration updated event
        this.sigverConfigurationService.configuration = updatedSigverConfiguration;
        this.sigverConfigurationService.saveConfiguration();

        this.editing = false;
    }

    private updateCoeFileInConfPath(): Promise<void>  {
        return new Promise<void>((resolve, reject) => {
            Fs.promises.readdir(Path.dirname(this.sigverConfigurationService.configurationPath)).then(filesInDir => {
                //Find the old co-simulation file and delete it if present.
                const existingCoeFile = filesInDir.find(fileName => fileName.toLowerCase().endsWith("cos.json"));
                if(existingCoeFile) {
                    const pathToFile = Path.join(Path.dirname(this.sigverConfigurationService.configurationPath), existingCoeFile);
                    Fs.unlinkSync(pathToFile);
                }
                //Copy the new file to the sigver project
                this.copyCoeToConfigPath().then(newCoePath => {
                    this.coePath = newCoePath;
                    resolve();
                });
                
            }).catch(err => reject(err));
        });
    }

    private copyCoeToConfigPath(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const expName = this.experimentPath.split(Path.sep);

            const newCoeFileName = "sigver_" + expName[expName.length-2] + "_" + expName[expName.length-1]+ "_" + "cos.json";
            const destinationPath = Path.join(Path.dirname(this.sigverConfigurationService.configurationPath), newCoeFileName);
            Fs.copyFile(this.coePath, destinationPath, (err) => {
                if (err) reject(err);
                resolve(destinationPath);
            });
        });
    }

    resetConfigurationOptionsViewElements() {
        // Set port reactivities to delayed
        let inputPorts: string[] = Object.values(this.coeConfig.multiModel.toObject().connections as Map<string, string[]>).reduce((prevVal, currVal) => prevVal.concat(currVal), []);
        this.portsToReactivity = new Map(inputPorts.map(p => [p, Reactivity.Delayed]));

        this.simEnvParams.convergenceAbsoluteTolerance = this.coeConfig.global_absolute_tolerance
        this.simEnvParams.convergenceRelativeTolerance = this.coeConfig.global_relative_tolerance;
        this.simEnvParams.convergenceAttempts = this.coeConfig.convergenceAttempts;
        this.simEnvParams.endTime = this.coeConfig.endTime;
        this.simEnvParams.startTime = this.coeConfig.startTime;
        this.simEnvParams.stepSize = this.coeConfig.algorithm.getStepSize();
    }

    locateAndsetCoePath(coeDir: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if(!coeDir){
                resolve();
            }
            if (!Fs.existsSync(coeDir) || !Fs.lstatSync(coeDir).isDirectory()) {
                reject(`"${coeDir}" is not a valid directory`)
            }
            Fs.promises.readdir(coeDir).then(filesInCOEDir => {
                var coeFileName = filesInCOEDir.find(fileName => fileName.toLowerCase().endsWith("coe.json"));
                if (coeFileName) {
                    this.coePath = Path.join(coeDir, coeFileName);
                    resolve();
                } else {
                    reject("Unable to locate coe file in directory: " + coeDir);
                }

            }).catch(err => reject(err));
        });
    }

    loadPriorExperimentsPaths() {
        let priorExperimentsPaths: string[] = []
        let files = Fs.readdirSync(this.experimentPath);
        for (let i in files) {
            let fileName = Path.join(this.experimentPath, files[i]);
            if (Fs.statSync(fileName).isDirectory()) {
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