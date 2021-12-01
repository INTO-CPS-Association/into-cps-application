import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject } from "rxjs";
import { exec, spawn } from "child_process";

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
    private serverProcess: any;
    private url: string = "";

    constructor(private httpClient: HttpClient) {
        this._onlineInterval = window.setInterval(() => this.isServerOnline(), 2000);
        this.url = "http://127.0.0.1:5000"; // "http://localhost";
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
        window.removeEventListener('beforeunload',this.stopServer); //TODO: Doesn't terminate the webserver on app close
        this.stopServer();
    }

    public async startServer(baseDir: string) {
        if (this.serverIsOnline) {
            return;
        }

        // this.serverProcess = spawn('python', ['-m', 'digital_twin_tooling', 'webapi', '-base', `${baseDir}`]);
        // console.log("DT tooling webserver PID: " + this.serverProcess.pid);

        // window.addEventListener('beforeunload', this.stopServer); //TODO: Doesn't terminate the webserver on app close
    }

    private stopServer() {
        // if(process.platform == "win32") exec(`taskkill /PID ${this.serverProcess.pid} /T /F`); else process.kill(-this.serverProcess.pid); 
        // console.log("Stopping DT tooling webserver with PID: " + this.serverProcess.pid);
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

    /*
        GET, CREATE, REMOVE PROJECT
    */
    public getProject(projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`${this.url}/projects/${projectName}`).toPromise().then(res => {
                resolve(res);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public createProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}`, "").toPromise().then(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public deleteProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}`).toPromise().then(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }


    /*
        ADDING NEW ITEMS 
    */
    public addTool(toolYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/tools`, toolYamlObj).subscribe((id: string) => {
                resolve(id);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public addServer(serverYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/servers`, serverYamlObj).subscribe((id: string) => {
                resolve(id);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public addConfiguration(configurationYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/configurations`, configurationYamlObj).subscribe((id: string) => {
                resolve(id);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public addTaskToConfiguration(configId: string, taskYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/configurations/${configId}/tasks`, taskYamlObj).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    /*
        UPDATING ITEMS 
    */
    public updateConfiguration(id: string, configurationYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/configurations/${id}`, configurationYamlObj).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public updateTask(configurationId: string, taskId: string, taskYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/configurations/${configurationId}/tasks/${taskId}`, taskYamlObj).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public updateTool(id: string, toolYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/tools/${id}`, toolYamlObj).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public updateServer(id: string, serverYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/servers/${id}`, serverYamlObj).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    /*
        REMOVING ITEMS 
    */
    public removeTool(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/tools/${id}`).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public removeServer(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/servers/${id}`).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public removeConfiguration(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/configurations/${id}`).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public removeTaskFromConfiguration(configurationId: string, taskId: string,projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/configurations/${configurationId}/tasks/${taskId}`).subscribe(() => {
                resolve();
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    /*
        RUNNING CONFIGURATIONS 
    */
    public runConfiguration(configurationId: string, projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/execution/configurations/${configurationId}/run`, "").subscribe(res => {
                resolve(res);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    /*
        OTHER API CALLS
    */
    public getSchemaDefinition(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`${this.url}//project/schemas`).subscribe(res => {
                resolve(res);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }
    public createFmuFromDataRepeater(configIndex: string, dataRepeaterIndex: string, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/prepare/config/configurations/${configIndex}/tasks/${dataRepeaterIndex}`, "").subscribe(res => {
                resolve((res as IDataRepeaterResponse).file);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }

    public getProjects(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.httpClient.get(`${this.url}/projects`).toPromise().then(res => {
                resolve(res as string[]);
            }, (err: HttpErrorResponse) => {
                reject(err.error);
            });
        });
    }
}