import {Component, Input, Output, EventEmitter} from "@angular/core";
import IntoCpsApp from "../../IntoCpsApp";
import * as Path from 'path';
import * as fs from 'fs';
import {Project} from "../../proj/Project";
import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
import { SimulationEnvironmentParameters, Reactivity, SvConfiguration} from "../../intocps-configurations/sv-configuration";

@Component({
    selector: "sv-configuration",
    templateUrl: "./angular2-app/sv/sv-configuration.component.html"
})
export class SvConfigurationComponent {
    private readonly notSelected = "";
    private mmPath: string = "";
    private coePath: string = "";
    private _svConfiguration: SvConfiguration = new SvConfiguration();

    reactivityKeys = Object.keys(Reactivity);
    editing: boolean = false;
    usePriorExperiment: boolean = false;
    verifyAlgorithm: boolean = false;
    canLocatePriorExperiment = true;
    experimentPath: string = this.notSelected;
    priorExperimentPath: string = this.notSelected;
    experimentsPaths: string [] = this.getExperimentsPaths(Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS));
    priorExperimentsPaths: string [] = [];

    multiModelConfig: MultiModelConfig;
    portsToReactivity: any[] = [];
    simEnvParams: SimulationEnvironmentParameters = new SimulationEnvironmentParameters();


    @Input()
    set svconfiguration(svConfiguration:SvConfiguration) {
        this._svConfiguration = svConfiguration;
        if(svConfiguration != undefined)
            this.setViewModelsFromConfig();
    }
    get svconfiguration():SvConfiguration {
        return this._svConfiguration;
    }

    @Output()
    configurationchanged = new EventEmitter<SvConfiguration>();


    setViewModelsFromConfig() {
        this.experimentPath = this._svConfiguration.experimentPath;
        this.usePriorExperiment = this._svConfiguration.priorExperimentPath != "";
        if(this.usePriorExperiment){
            this.loadPriorExperimentsPaths();
            this.priorExperimentPath = this._svConfiguration.priorExperimentPath;
            this.canLocatePriorExperiment = this.priorExperimentsPaths.findIndex(p => p.includes(this.priorExperimentPath)) >= 0;
        }
        this.simEnvParams = this._svConfiguration.simulationEnvironmentParameters;
        this.mmPath = this._svConfiguration.mmPath;
        this.portsToReactivity = Array.from(this._svConfiguration.extendedMultiModel.reactivity, ([key, value]) => ({ port: key, reactivity: value}));
    }

    experimentNameFromPath(path: string, depth: number): string{
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

    getFiles(path: string): string [] {
        let fileList: string[] = [];
        let files = fs.readdirSync(path);
        for(let i in files){
            let name = Path.join(path, files[i]);
            if (fs.statSync(name).isDirectory()){
                fileList = fileList.concat(this.getFiles(name));
            } else {
                fileList.push(name);
            }
        }
    
        return fileList;
    }

    getNameOfSelectedExperiment(): string {
        return this.experimentNameFromPath(this.usePriorExperiment ? this.priorExperimentPath : this.experimentPath, this.usePriorExperiment ? 3 : 2);
    }

    locateAndSetCoePath(path: string){
        path = Path.join(path, "coe.json");
        if(!fs.existsSync(path)) {
            console.error("Unable to locate the coe file at: " + path);
        }
        this.coePath = path;
    }

    locateAndSetMMPath(path: string){
        path = Path.join(path, "mm.json");
        if(!fs.existsSync(path)) {
            console.error("Unable to locate the multi model file at: " + path);
        }
        this.mmPath = path;
    }

    onExperimentPathChanged(experimentPath: string) {
        this.loadPriorExperimentsPaths();
        this.experimentPath = experimentPath;
        this.usePriorExperiment = false;
        this.priorExperimentPath = this.notSelected;
        this.handleExperimentPathChanged(Path.join(experimentPath, ".."), experimentPath);
    }

    onPriorExperimentPathChanged(experimentPath: string) {
        this.priorExperimentPath = experimentPath;
        this.usePriorExperiment = true;
        this.handleExperimentPathChanged(experimentPath, experimentPath);
    }

    handleExperimentPathChanged(mmPath: string, coePath: string) {
        this.verifyAlgorithm = false;
        this.canLocatePriorExperiment = true;
        this.locateAndSetMMPath(mmPath);
        this.locateAndSetCoePath(coePath);
        this.populatePortOptions();
        this.simEnvParams = this.coeToSimulationEnvironmentParameters();
    }

    onReactivityChanged(portWithReactivity: {port: string, reactivity: Reactivity}, reactivity: string) {
        portWithReactivity.reactivity = Reactivity[reactivity as keyof typeof Reactivity]
    }

    parseConfig(mmPath : string): Promise<void | MultiModelConfig> {
        let project = IntoCpsApp.getInstance().getActiveProject();
        return MultiModelConfig
            .parse(mmPath, project.getFmusPath())
            .catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    populatePortOptions() {
        this.parseConfig(this.mmPath).then((multiModel: MultiModelConfig) => {
            this.multiModelConfig = multiModel;
            let connsMap: Map<string, string[]> = multiModel.toObject().connections;
            
            let inputPorts = Object.values(connsMap).reduce((prevVal, currVal) => prevVal.concat(currVal), []);

            this.portsToReactivity = [];
            let trackExistingVals: Map<string, boolean> = new Map();
            for (let i=0; i<inputPorts.length; i++) {
                let v = inputPorts[i];
              if (!trackExistingVals.has(v)) {
                this.portsToReactivity.push({port: v, reactivity: Reactivity.Delayed});
                trackExistingVals.set(v, true);
              }
            }

        }, reason => {
            console.error(`${reason}`)
        });
    }

    coeToSimulationEnvironmentParameters(): SimulationEnvironmentParameters {
        const simulationEnvironmentToReturn = new SimulationEnvironmentParameters();
        fs.readFile(this.coePath, (error, data) => {
            if (error){
                console.error(`Unable to read coe file: ${error}`)
            }
            else{
                const jsonObj = JSON.parse(data.toString());
                simulationEnvironmentToReturn.convergenceAbsoluteTolerance = jsonObj["global_absolute_tolerance"];
                simulationEnvironmentToReturn.convergenceRelativeTolerance = jsonObj["global_relative_tolerance"];
                simulationEnvironmentToReturn.convergenceAttempts = 5;
                simulationEnvironmentToReturn.endTime = jsonObj["endTime"];
                simulationEnvironmentToReturn.startTime = jsonObj["startTime"];
                simulationEnvironmentToReturn.stepSize = jsonObj["algorithm"]["type"] == "fixed-step" ? jsonObj["algorithm"]["size"] : jsonObj["algorithm"]["initsize"];
            }
        });
        return simulationEnvironmentToReturn;
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;

        confirm("Save your work before leaving?")
    }

    onSubmit() {
        if (!this.editing) return;

        // Set changes from the view models in the configuration
        Object.assign(this._svConfiguration.extendedMultiModel, this.multiModelConfig);
        this._svConfiguration.extendedMultiModel.reactivity = new Map(this.portsToReactivity.map(item => [item.port, item.reactivity]));
        this._svConfiguration.extendedMultiModel.verification = this.verifyAlgorithm;
        this._svConfiguration.masterModel = "";
        this._svConfiguration.mmPath = this.mmPath;
        this._svConfiguration.fmuRootPath = IntoCpsApp.getInstance().getActiveProject().getFmusPath();
        this._svConfiguration.simulationEnvironmentParameters = this.simEnvParams;
        this._svConfiguration.serializeToJsonString();
        this._svConfiguration.experimentPath = this.experimentPath;
        if(this.usePriorExperiment){
            this.usePriorExperiment = this.priorExperimentPath != "";
            this._svConfiguration.priorExperimentPath = this.priorExperimentPath;
        }

        // Inform of changes
        this.configurationchanged.emit(this._svConfiguration)
       
        this.editing = false;
    }
}