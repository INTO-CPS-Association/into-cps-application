import { Injectable } from "@angular/core";
import { Subject } from 'rxjs';
import { SvConfiguration } from "../../intocps-configurations/sv-configuration";
import * as fs from 'fs';

@Injectable()
export class SvConfigurationService{
    private _configuration: SvConfiguration = new SvConfiguration;
    private _configurationChanged = new Subject<boolean>();
    configurationChangedObservable = this._configurationChanged.asObservable();
    configPath: string;
    isEmptyConfiguration: boolean = true;
    saveOnChanges: boolean = true;
    reactivityChanged: boolean = false;

    setConfigurationFromPath(path: string = ""): Promise<boolean>{
        return new Promise<boolean> ((resolve, reject) =>{
            let filePath = path == "" ? this.configPath : path;
            fs.readFile(filePath, (fileErr, fileData) => {
                if(fileErr){
                    reject(`Unable to read configuration file from: ${filePath} due to: ${fileErr}`);
                }
                SvConfiguration.createFromJsonString(fileData.toString()).then(res => {
                    this._configuration = res;
                    this.isEmptyConfiguration = this._configuration.experimentPath == "";
                    this.informOfChanges();
                    resolve(true);
                }).catch(err =>{
                    reject(`Unable to set configuration from file: ${filePath} due to: ${err}`);
                }); 
            });
        });
    }

    informOfChanges(){
        this._configurationChanged.next(true);
    }

    isConfigValid(): boolean {
        return this.configuration.multiModel.fmus.length > 0 && this.configuration.multiModel.validate().length == 0;
    }

    set configuration(svConfiguration: SvConfiguration){
        // Search for changes that invalidates the masterModel
        if(this._configuration.masterModel != ""){
            for (const entry of Array.from(this._configuration.reactivity.entries())) {
                if(!svConfiguration.reactivity.has(entry[0]) || svConfiguration.reactivity.get(entry[0]) != entry[1]){
                    this.reactivityChanged = true;
                    break;
                }
            }
        }
        
        this._configuration = svConfiguration;
        this.isEmptyConfiguration = this._configuration.experimentPath == "";
        if(this.saveOnChanges){
            this.saveConfiguration();
        }
        this.informOfChanges();
    }

    get configuration(): SvConfiguration{
        return this._configuration;
    }

    saveConfiguration(path: string = ""): boolean{
        // Save the configuration
        try{
            fs.writeFileSync(path == "" ? this.configPath : path, this._configuration.toJsonString());
        }
        catch(err){
            console.error(`Unable to write configuration to file: ${err}`)
            return false;
        }
        return true;
    }
}