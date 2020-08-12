import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoeSimulationService } from '../coe/coe-simulation.service';
import { SettingsService, SettingKeys } from '../shared/settings.service';
import IntoCpsApp from "../../IntoCpsApp";
import { HttpClient } from '@angular/common/http';
import { timeout, map } from 'rxjs/operators';
import * as Path from 'path';

@Component({
    selector: "dse-coe-launch",
    providers: [
        CoeSimulationService
    ],
    templateUrl: "./angular2-app/dse/dse-coe-launch.component.html"  
})
export class DseCoeLaunchComponent implements OnInit, OnDestroy {

    
    private onlineInterval:number;
    private _path:string;
    editing: boolean = false;
    editingMM: boolean = false;
    parseError: string = null;

    mmSelected:boolean = true;
    mmPath:string = '';

    cosimConfig:string[] = [];
    mmOutputs:string[] = [];
    objNames:string[] = [];
    coeconfig:string = '';

    online:boolean = false;
    url:string = '';
    version:string = '';
    constructor(private coeSimulation:CoeSimulationService, private http:HttpClient,
        private settings:SettingsService) {    }

    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8082";
        this.onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    /*
     * Method to check if can run a DSE. Will check if the COE is online, if there are any warnings
     * and also some DSE-specific elements
     */
    canRun() {
        return this.online
    }

    /*
     * Method to run a DSE with the current DSE configuration. Assumes that the DSE can be run. 
     * The method does not need to send the DSEConfiguration object, simply the correct paths. It relies upon the
     * config being saved to json format correctly.
     */
    runDse() {
        console.log(this.coeconfig);
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_DIR);

        let absoluteProjectPath = IntoCpsApp.getInstance().getActiveProject().getRootFilePath();
        let experimentConfigName = this._path.slice(absoluteProjectPath.length + 1, this._path.length);
        let multiModelConfigName = this.coeconfig.slice(absoluteProjectPath.length + 1, this.coeconfig.length); 
        // check if python is installed.
        /* dependencyCheckPythonVersion(); */


        //Using algorithm selector script allows any algortithm to be used in a DSE config.
        let scriptFile = Path.join(installDir, "dse", "Algorithm_selector.py"); 
        var child = spawn("python", [scriptFile, absoluteProjectPath, experimentConfigName, multiModelConfigName], {
            detached: true,
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            console.log('dse/stdout: ' + data);
        });
        child.stderr.on('data', function (data: any) {
            console.log('dse/stderr: ' + data);
        });
    }

    isCoeOnline() {
        this.http
            .get(`http://${this.url}/version`).pipe(
            timeout(2000),
            map(response => response),)
            .subscribe((data:any) => {
                this.online = true;
                this.version = data.version;
            }, () => this.online = false);
    }

    onCoeLaunchClick() {
        this.coeSimulation.
    openCOEServerStatusWindow("autolaunch", false);
    }
}