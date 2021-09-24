import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';
import { Reactivity, SimulationEnvironmentParameters, SvConfiguration } from "../../intocps-configurations/sv-configuration";
import * as fs from 'fs';
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";

@Injectable()
export class SvConfigurationService{
    private readonly SCENARIOVERIFIER_TAG: string = "scenarioVerifier";
    private readonly VERIFICATION_TAG: string = "verification";
    private readonly TRACEVISUALIZATION_TAG: string = "traceVisualization";
    private _configuration: SvConfiguration = new SvConfiguration;
    private _configurationChanged = new Subject<boolean>();

    configurationChangedObservable = this._configurationChanged.asObservable();
    configurationPath: string;
    automaticallySaveOnChanges: boolean = true;
    isDefaultConfiguration: boolean = true;

    setConfigurationFromPath(path: string = ""): Promise<boolean>{
        return new Promise<boolean> ((resolve, reject) =>{
            let filePath = path == "" ? this.configurationPath : path;
            fs.readFile(filePath, (fileErr, fileData) => {
                if(fileErr){
                    reject(`Unable to read configuration file from: ${filePath} due to: ${fileErr}`);
                }
                SvConfiguration.createFromJsonString(fileData.toString()).then(res => {
                    this._configuration = res;
                    this.isDefaultConfiguration = this._configuration.experimentPath == "";
                    this.configurationChanged();
                    resolve(true);
                }).catch(err =>{
                    reject(`Unable to set configuration from file: ${filePath} due to: ${err}`);
                }); 
            });
        });
    }

    configurationChanged(){
        this._configurationChanged.next(true);
    }

    isConfigValid(): boolean {
        return this._configuration.multiModel.fmus.length > 0;
    }

    set configuration(svConfiguration: SvConfiguration){
        // Search for changes that invalidates the masterModel
        let resetMasterModel: boolean = false;
        if(svConfiguration.masterModel != ""){
            for (const entry of Array.from(this._configuration.reactivity.entries())) {
                if(!svConfiguration.reactivity.has(entry[0]) || svConfiguration.reactivity.get(entry[0]) != entry[1]){
                    resetMasterModel = true;
                    break;
                }
            }
        }
        this._configuration = svConfiguration;
        if(!this.isConfigValid() || resetMasterModel){
            this._configuration.masterModel = "";
        }

        if(this.automaticallySaveOnChanges){
            this.saveConfiguration();
        }

        this.configurationChanged();
    }
    
    get configuration(): SvConfiguration{
        return this._configuration;
    }

    saveConfiguration(path: string = ""): boolean{
        try{
            fs.writeFileSync(path == "" ? this.configurationPath : path, this._configuration.toJsonString());
        }
        catch(err){
            console.error(`Unable to write configuration to file: ${err}`)
            return false;
        }
        return true;
    }

    configurationToExtendedMultiModelDTO(verify: boolean = false): any{
        const extendedMultiModelDTO = this._configuration.multiModel.toObject();
        let fmus: any = {};
        this._configuration.multiModel.fmus.forEach(fmu => {
            let fmuPath;
            if (fmu.isNested()){
                fmuPath = "coe:/" + fmu.path;
            }
            else{
                fmuPath = "file:///" + fmu.path
            }
            fmus[fmu.name] = fmuPath.replace(/\\/g, "/").replace(/ /g, "%20");
        });
        extendedMultiModelDTO["fmus"] = fmus;

        const reactivity: { [key: string]: Reactivity } = {};
        this._configuration.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));

        const scenarioVerifierDTO: any = {}
        scenarioVerifierDTO[SvConfiguration.REACTIVITY_TAG] = reactivity;
        scenarioVerifierDTO[this.VERIFICATION_TAG] = verify;
        scenarioVerifierDTO[this.TRACEVISUALIZATION_TAG] = false;

        extendedMultiModelDTO[this.SCENARIOVERIFIER_TAG] = scenarioVerifierDTO;

        return extendedMultiModelDTO
    }

    configurationToExecutableMMDTO(verify: boolean = false): any {
        const executableMMDTO: any = {}
        executableMMDTO[SvConfiguration.MASTERMODEL_TAG] = this._configuration.masterModel;
        executableMMDTO[SvConfiguration.MULTIMODEL_TAG] = this.configurationToExtendedMultiModelDTO(verify);
        executableMMDTO[SvConfiguration.EXECUTIONPARAMETERS_TAG] = this._configuration.simulationEnvironmentParameters;
        return executableMMDTO;
    }
}