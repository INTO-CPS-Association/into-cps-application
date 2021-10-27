import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DataRepeaterDtpType, DtpTypes, TaskConfigurationDtpType } from "../../intocps-configurations/dtp-configuration";
import { Subject } from "rxjs";
import { spawn } from 'child_process';
import * as Path from 'path';
import * as fs from "fs";

export interface IDataRepeaterResponse {
    file: string;
    signals: Object
};

@Injectable()
export class DtpDtToolingService implements OnDestroy {
    private _isOnline = new Subject<boolean>();
    private _onlineInterval: number;
    public isOnlineObservable = this._isOnline.asObservable();
    public serverIsOnline: boolean = false;
    public projectPath: string = "";
    private serverProcess: any;
    private projectName: string = "";
    private url: string = "";
    constructor(private httpClient: HttpClient) {
        this._onlineInterval = window.setInterval(() => this.isServerOnline(), 2000);
        this.url = "http://localhost"; //http://127.0.0.1:5000
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
    }

    public async startServer(projectPath: string) {
        if (this.serverIsOnline) {
            return;
        }

        const basePath = Path.join(projectPath, "..");
        this.serverProcess = spawn('python', ['-m', 'digital_twin_tooling', 'webapi', '-base', `${basePath}`]);
        console.log("DT tooling webserver PID: " + this.serverProcess.pid);

        this.projectPath = projectPath;
        this.projectName = Path.basename(projectPath);
    }

    public async stopServer() {
        this.serverProcess.kill();
        console.log("Stopping DT tooling webserver with PID: " + this.serverProcess.pid);
    }

    isServerOnline() {
        this.httpClient.get(`${this.url}/`, { responseType: 'text' }).subscribe(() => {
            this._isOnline.next(true);
            this.serverIsOnline = true;
        }, () => {
            this._isOnline.next(false);
            this.serverIsOnline = false;
        });
    }

    public createProjectWithConfig(yamlConfig: object): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${this.projectName}/config`, yamlConfig).toPromise().then(() => {
                resolve();
            }, (err) => {
                reject(err);
            })
        });
    }

    public createProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}`, "").toPromise().then(() => {
                resolve();
            }, (err) => {
                reject(err);
            })
        });
    }

    public deleteProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/project/${projectName}`).toPromise().then(() => {
                resolve();
            }, (err) => {
                reject(err);
            })
        });
    }

    // public createFmuFromDataRepeater(dataRepeaterObj: any, toolPath: string): Promise<string> {
    //     const jsonData: any = {}
    //     jsonData["data_repeater"] = dataRepeaterObj;
    //     jsonData["tool_path"] = toolPath;
    //     return new Promise<string>((resolve, reject) => {
    //         this.httpClient.post(`${this.url}/generatefmu`, jsonData).subscribe(response => {
    //             const res = response as IDataRepeaterResponse;
    //             const tempFmuPath = res.file;
    //             const targetFmuPath = Path.join(this.projectPath, `${dataRepeaterObj.name}.fmu`);
    
    //             fs.promises.copyFile(tempFmuPath, targetFmuPath).then(() => {
    //                 fs.rmdirSync(Path.dirname(tempFmuPath), {recursive: true});
    //                 console.log("Deleted temp dir: " + tempFmuPath);
    //                 resolve(targetFmuPath);
    //             }).catch(err => {reject(err)});

    //         }, err => reject(err));
    //     });
    // }

    public createFmuFromDataRepeaterIndex(index: string, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/prepare/config/${index}`, "").subscribe(res => {
                resolve((res as IDataRepeaterResponse).file);
            }, err => reject(err));
        });
    }

    public addItemToProject(index: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/${index}`, "").subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public removeItemFromPorject(index: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/${index}`, "").subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public createFmusFromDataRepeaters(configurations: TaskConfigurationDtpType[], projectName: string): Promise<string[]> {
        const dataRepeatersToConvert: Array<DataRepeaterDtpType> = [];
        const results: Promise<string>[] = [];
        for (let i = 0; i < configurations.length; i++) {
            const conf: TaskConfigurationDtpType = configurations[i] as TaskConfigurationDtpType;
            for (let l = 0; l < conf.tasks.length; l++) {
                if (conf.tasks[l].type == DtpTypes.DataRepeater) {
                    if (dataRepeatersToConvert.findIndex(dr => dr.name == conf.tasks[l].name) == -1) {
                        results.push(this.createFmuFromDataRepeaterIndex(`configurations/${i}/tasks/${l}`, projectName));
                        dataRepeatersToConvert.push(conf.tasks[l] as DataRepeaterDtpType);
                    }
                }
            }
        }

        return new Promise<string[]>((resolve, reject) => {
            Promise.all(results).then(responses => resolve(responses), err => reject(err));
        });
    }

}