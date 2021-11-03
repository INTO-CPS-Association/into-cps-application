import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { exec, spawn } from 'child_process';

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
    private url: string = "";

    constructor(private httpClient: HttpClient) {
        this._onlineInterval = window.setInterval(() => this.isServerOnline(), 2000);
        this.url = "http://127.0.0.1:5000" //"http://localhost";
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
        window.removeEventListener('beforeunload',this.stopServer); //TODO: Doesn't terminate the webserver on app close
        this.stopServer();
    }

    public async startServer(projectDir: string) {
        if (this.serverIsOnline) {
            return;
        }

        this.serverProcess = spawn('python', ['-m', 'digital_twin_tooling', 'webapi', '-base', `${projectDir}`]);
        console.log("DT tooling webserver PID: " + this.serverProcess.pid);

        this.projectPath = projectDir;
        window.addEventListener('beforeunload', this.stopServer); //TODO: Doesn't terminate the webserver on app close
    }

    public stopServer() {
        if(process.platform == "win32") exec(`taskkill /PID ${this.serverProcess.pid} /T /F`); else process.kill(-this.serverProcess.pid); 
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

    public getProjects(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.httpClient.get(`${this.url}/project`).toPromise().then(res => {
                resolve(res as string[]);
            }, (err) => {
                reject(err);
            })
        });
    }

    public getProject(projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`${this.url}/project/${projectName}`).toPromise().then(res => {
                resolve(res);
            }, (err) => {
                reject(err);
            })
        });
    }

    public createProjectWithConfig(projectName: string, yamlConfig: object): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config`, yamlConfig).toPromise().then(() => {
                resolve();
            }, (err) => {
                reject(err);
            })
        });
    }

    public createProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const emptyConfiguration: any[] = [];
            const emptyConfObj = {tools: {}, servers: {}, configurations: emptyConfiguration, version: "0.0.1"};
            this.httpClient.post(`${this.url}/project/${projectName}`, "").toPromise().then(() => {
                this.httpClient.post(`${this.url}/project/${projectName}/config`, emptyConfObj).toPromise().then(() => {
                    resolve();
                }, (err) => {
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
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

    public createFmuFromDataRepeater(configIndex: string, dataRepeaterIndex: string, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/prepare/config/configurations/${configIndex}/tasks/${dataRepeaterIndex}`, "").subscribe(res => {
                resolve((res as IDataRepeaterResponse).file);
            }, err => reject(err));
        });
    }

    public addToolToProject(toolName: string, toolYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/tools/${toolName}`, toolYamlObj).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public addServerToProject(serverName: string, serverYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/servers/${serverName}`, serverYamlObj).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }


    public addConfigurationToProject(configurationYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/configurations`, configurationYamlObj).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public addTaskToConfiguration(taskYamlObj: any, configurationIndex: string, taskIndex: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/project/${projectName}/config/configurations/${configurationIndex}/tasks/${taskIndex}`, taskYamlObj).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public removeToolInProject(index: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/project/${projectName}/config/tools/${index}`).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public removeServerInProject(index: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/project/${projectName}/config/servers/${index}`).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public removeConfigurationInProject(index: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/project/${projectName}/config/configurations/${index}`).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }

    public removeTaskFromConfiguration(configurationIndex: string, taskIndex: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/project/${projectName}/config/configurations/${configurationIndex}/tasks/${taskIndex}`).subscribe(() => {
                resolve();
            }, err => reject(err));
        });
    }
}