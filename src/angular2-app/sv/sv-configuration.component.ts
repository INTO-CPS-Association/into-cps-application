import {Component, OnDestroy} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import {Project} from "../../proj/Project";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import { SimulationEnvironmentParameters, Reactivity, SvConfiguration} from "../../intocps-configurations/sv-configuration";
import { SvConfigurationService } from "./sv-configuration.service";
import { Subscription } from 'rxjs';

@Component({
    selector: "sv-configuration",
    templateUrl: "./angular2-app/sv/sv-configuration.component.html"
})
export class SvConfigurationComponent implements OnDestroy{
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

    multiModelConfig: MultiModelConfig;
    portsToReactivity: any[] = [];
    simEnvParams: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();

    constructor(private svConfigurationService: SvConfigurationService){
        this._configurationChangedSub = this.svConfigurationService.configurationChangedObservable.subscribe(() => {
            this.setViewModelItemsFromConfig();
        });
    }
    ngOnDestroy(): void {
        this._configurationChangedSub.unsubscribe();
    }

    setViewModelItemsFromConfig() {
        this.experimentPath = this.svConfigurationService.configuration.experimentPath;
        let coeFolderPath = this.experimentPath;
        let mmFolderPath = Path.join(this.experimentPath, "..")
        this.usePriorExperiment = this.svConfigurationService.configuration.priorExperimentPath != "";
        if(this.experimentPath != ""){
            this.loadPriorExperimentsPaths();
        }
        if(this.usePriorExperiment){
            this.priorExperimentPath = this.svConfigurationService.configuration.priorExperimentPath;
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
            this.setMultimodelFromConfig(this.mmPath);
        }
        this.simEnvParams = this.svConfigurationService.configuration.simulationEnvironmentParameters;
        this.portsToReactivity = Array.from(this.svConfigurationService.configuration.reactivity, ([key, value]) => ({ port: key, reactivity: value}));
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

    isValidFilePath(path: string): boolean {
        if(!fs.existsSync(path)) {
            console.error("Unable to locate the file at: " + path);
            return false;
        }
        return true;
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

    resetConfigurationOptionsViewElements() {
        // Set port reactivities to delayed
        let connectionsMap: Map<string, string[]> = this.multiModelConfig.toObject().connections;
            
        let inputPorts = Object.values(connectionsMap).reduce((prevVal, currVal) => prevVal.concat(currVal), []);

        this.portsToReactivity = [];
        let trackExistingVals: Map<string, boolean> = new Map();
        for (let i=0; i<inputPorts.length; i++) {
            let v = inputPorts[i];
            if (!trackExistingVals.has(v)) {
            this.portsToReactivity.push({port: v, reactivity: Reactivity.Delayed});
            trackExistingVals.set(v, true);
            }
        }

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
                this.setMultimodelFromConfig(this.mmPath).then(() => {
                    if(this.isValidFilePath(newCoePath)){
                        this.coePath = newCoePath;
                        resolve();
                    }
                    else {
                        //TODO: Handle unable to locate coe json
                        reject();
                    }
                }, reason => {
                    console.error(`${reason}`)
                });
            }
            else {
                //TODO: Handle unable to locate mm json
                reject();
            }
        });
    }

    onReactivityChanged(portWithReactivity: {port: string, reactivity: Reactivity}, reactivity: string) {
        portWithReactivity.reactivity = Reactivity[reactivity as keyof typeof Reactivity]
    }

    setMultimodelFromConfig(mmPath : string): Promise<void> {
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
    
    onNavigate(): boolean {
        if (!this.editing)
            return true;

        confirm("Save your work before leaving?")
    }

    onSubmit() {
        if (!this.editing) return;

        const updatedSvConfiguration = new SvConfiguration;

        // Set changes from the view models in the configuration
        Object.assign(updatedSvConfiguration.multiModel, this.multiModelConfig);
        updatedSvConfiguration.reactivity = new Map(this.portsToReactivity.map(item => [item.port, item.reactivity]));
        updatedSvConfiguration.fmuRootPath = IntoCpsApp.getInstance().getActiveProject().getFmusPath();
        updatedSvConfiguration.simulationEnvironmentParameters = this.simEnvParams;
        updatedSvConfiguration.experimentPath = this.experimentPath;
        updatedSvConfiguration.priorExperimentPath = !this.usePriorExperiment ? this.noPath : this.priorExperimentPath;
        updatedSvConfiguration.masterModel = this.svConfigurationService.configuration.masterModel;
        this.svConfigurationService.configuration = updatedSvConfiguration;
       
        this.editing = false;
    }
}