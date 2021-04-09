import { Component, OnInit, OnDestroy, Input, NgZone } from '@angular/core';
import { CoeSimulationService } from '../coe/coe-simulation.service';
import { SettingsService, SettingKeys } from '../shared/settings.service';
import IntoCpsApp from "../../IntoCpsApp";
import { HttpClient } from '@angular/common/http';
import { timeout, map } from 'rxjs/operators';
import {Project} from "../../proj/Project";
import * as fs from 'fs';
import * as Path from 'path';

import {DomSanitizer} from '@angular/platform-browser';
import { dependencyCheckPythonVersion } from "../dependencies/Dependencychecker";
// https://www.electronjs.org/docs/api/dialog dialog from main thread. If you want to use the dialog object from a renderer process, remember to access it using the remote: 
const { dialog } = require('electron').remote;

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
    private resultdir: string;
    @Input()
    set path(path:string) {
        this._path = path;

        if (path){
            let app: IntoCpsApp = IntoCpsApp.getInstance();
            let p: string = app.getActiveProject().getRootFilePath();
            this.cosimConfig = this.loadCosimConfigs(Path.join(p, Project.PATH_MULTI_MODELS));

            if(this.coeSimulation)
                this.coeSimulation.reset();
        }
    }
    get path():string {
        return this._path;
    }
    editing: boolean = false;
    editingMM: boolean = false;
    simsuccess: boolean = false;
    simfailed: boolean = false;
    parseError: string = null;
    simulation: boolean = false;
    resultshtml: any = null;
    resultpath: any = null;

    mmSelected:boolean = true;
    mmPath:string = '';

    cosimConfig:string[] = [];
    mmOutputs:string[] = [];
    objNames:string[] = [];
    
    @Input()
    coeconfig:string = '';

    online:boolean = false;
    url:string = '';
    version:string = '';
    constructor(private coeSimulation:CoeSimulationService, private http:HttpClient,
        private settings:SettingsService, private zone:NgZone,
        private sanitizer:DomSanitizer) {    }

    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8083";
        this.onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
        console.log(this.path);
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    getFiles(path: string): string [] {
        var fileList: string[] = [];
        var files = fs.readdirSync(path);
        for(var i in files){
            var name = Path.join(path, files[i]);
            if (fs.statSync(name).isDirectory()){
                fileList = fileList.concat(this.getFiles(name));
            } else {
                fileList.push(name);
            }
        }
    
        return fileList;
    }

    resetParseError() {
        this.zone.run(() => {
            this.parseError = null;
        });
    }
    

    loadCosimConfigs(path: string): string[] {
        var files: string[] = this.getFiles(path);
        return  files.filter(f => f.endsWith("coe.json"));
    }
    /*
     * Method to check if can run a DSE. Will check if the COE is online, if there are any warnings
     * and also some DSE-specific elements
     */
    canRun() {
        return this.online
        && this.coeconfig != ""
        && !this.simulation
        /* && this.dseWarnings.length === 0
        && this.coeWarnings.length === 0 */
        //&& this.config.dseSearchParameters.length > 1 
      /*   && this.config
        && this.config.extScrObjectives
        && (this.config.extScrObjectives.length + this.config.intFunctObjectives.length) >= 2; */
    }

    resultWatch() {
        var dir = Path.dirname(this._path);
        fs.watch(dir, (eventType, filename) => {
            /* console.log(`event type is: ${eventType}`); */
            if (filename) {
                if(eventType == 'rename') {
                     this.resultdir = Path.normalize(`${filename}/results.html`);
                }
              /* console.log(`filename provided: ${filename}`); */
            } else {
              console.log('filename not provided');
            }
          });
          console.log(this.resultdir);
    }

    /*
     * Method to run a DSE with the current DSE configuration. Assumes that the DSE can be run. 
     * The method does not need to send the DSEConfiguration object, simply the correct paths. It relies upon the
     * config being saved to json format correctly.
     */
    runDse() {
        var dir = Path.dirname(this._path);
        fs.watch(dir, (eventType, filename) => {
            console.log(`event type is: ${eventType}`);
            if (filename) {
                if(eventType == 'rename') {
                    this.resultdir = Path.join(dir,filename);
                }
              console.log(`filename provided: ${filename}`);
            } else {
              console.log('filename not provided');
            }
          });
        this.simulation = true;
        this.simfailed = false;
        this.simsuccess = false;
        var stdoutChunks: any[] = [];
        var stderrChunks: any[] = [];
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_DIR);

        let absoluteProjectPath = IntoCpsApp.getInstance().getActiveProject().getRootFilePath();
        let experimentConfigName = this._path.slice(absoluteProjectPath.length + 1, this._path.length);
        let multiModelConfigName = this.coeconfig.slice(absoluteProjectPath.length + 1, this.coeconfig.length); 


        //Using algorithm selector script allows any algortithm to be used in a DSE config.
        let scriptFile = Path.join(installDir, "dse", "Algorithm_selector.py"); 
        var child = spawn("python", [scriptFile, absoluteProjectPath, experimentConfigName, multiModelConfigName], {
            /* detached: true, */
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.on('error', (err: any) => {
            // When the python was not found in your system
            console.error('Failed to start subprocess.'+ err.message);
            dialog.showMessageBox(
                {
                  type: "error",
                  buttons: ["OK"],
                  message:
                    "Python spawn failed \n" +
                    "Check if Python is install and available in the path \n" +
                    err.message
                }
              );
              this.simfailed = true;
              this.simulation = false;
          });

        child.on('close', (code: any) => {
            console.log(`child process close all stdio with code ${code}`);
        });
          
        child.on('end', (code: any) => {
            console.log(`child process exited with code ${code}`);
        });

        child.stdout.on('data', function (data: any) {
            stdoutChunks = stdoutChunks.concat(data);
        });
        child.stdout.on('end', () => {
            var stdoutContent = Buffer.concat(stdoutChunks).toString();
            console.log('stdout chars:', stdoutContent.length);
            // see the output uncomment this line
            // console.log(stdoutContent);
        });
        child.stderr.on('data', function (data: any) {
            stderrChunks = stderrChunks.concat(data);
        });
        child.stderr.on('end', () => {
            var stderrContent = Buffer.concat(stderrChunks).toString();
            console.log('stderr chars:', stderrContent.length);
            
            console.log(stderrContent);
            if(stderrContent.length > 0) {
                this.parseError = stderrContent;
                console.warn(this.parseError);
                this.simfailed = true;
                this.simulation = false;
                dialog.showMessageBox(
                    {
                      type: "error",
                      buttons: ["OK"],
                      message:
                        "Running DSE failed. \n" +
                        this.parseError.toString().substr(0,25) +
                        "See full error description in devtools. \n"
                    }
                  );
            } else {
                this.simsuccess = true;
                this.simulation = false;
                console.log("end DSE sim");
                console.log(this.resultdir);
                this.resultpath = Path.normalize(`${this.resultdir}/results.html`);
 		        this.http.get(this.resultpath,{responseType:'text'}).subscribe(res=>{
                this.resultshtml = this.sanitizer.bypassSecurityTrustHtml(res);
                });
                console.log(this.resultpath);
            }
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
