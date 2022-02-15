import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject } from "rxjs";
import { ChildProcessWithoutNullStreams, execSync, spawn } from "child_process";

export interface IDataRepeaterResponse {
    file: string;
    signals: Object;
}

@Injectable()
export class DtpDtToolingService implements OnDestroy {
    private _isOnline = new Subject<boolean>();
    private _onlineInterval: number;
    private static _serverProc: ChildProcessWithoutNullStreams;
    public readonly url: string = "";
    public isOnlineObservable = this._isOnline.asObservable();
    private _isServerOnline: boolean = false;

    constructor(private httpClient: HttpClient) {
        this._onlineInterval = window.setInterval(() => this.getIsServerOnline(), 2000);
        this.url = "http://127.0.0.1:5000"; //http://localhost
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
        window.removeEventListener("beforeunload", this.stopServer);
        this.stopServer();
    }

    public startServer(baseDir: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (DtpDtToolingService._serverProc) {
                return resolve();
            }

            DtpDtToolingService._serverProc = spawn("python", ["-m", "digital_twin_tooling", "webapi", "-base", `${baseDir}`]);
            console.log("DT tooling webserver PID: " + DtpDtToolingService._serverProc.pid);

            window.addEventListener("beforeunload", this.stopServer); //beforeunload
            this.getIsServerOnline().finally(() => {
                if (this._isServerOnline) return resolve();
                return reject("Unable to start the server");
            });
        });
    }

    private stopServer() {
        this.getStopServer()
            .then((sutdownMsg) =>
                console.log(
                    `Stopping DT tooling server with PID: ${
                        DtpDtToolingService._serverProc?.pid ?? "??"
                    }. Server shutdown msg: ${sutdownMsg}`
                )
            )
            .catch((err) => console.warn(err));
        DtpDtToolingService._serverProc = null;
    }

    public getStopServer(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.get(`${this.url}/server/shutdown`).subscribe(
                (shutdownMsg: string) => {
                    resolve(shutdownMsg);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public getIsServerOnline(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.httpClient
                .get(`${this.url}/`, { responseType: "text" })
                .toPromise()
                .then(() => {
                    if (!this._isServerOnline) {
                        this._isOnline.next(true);
                        this._isServerOnline = true;
                    }
                })
                .catch(() => {
                    if (this._isServerOnline) {
                        this._isOnline.next(false);
                        this._isServerOnline = false;
                    }
                })
                .finally(() => resolve(this._isServerOnline));
        });
    }

    /*
        GET, CREATE, REMOVE PROJECT
    */
    public getProject(projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`${this.url}/projects/${projectName}`).subscribe(
                (res) => {
                    resolve(res);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public createProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}`, "").subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public deleteProject(projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}`).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    /*
        ADDING NEW ITEMS 
    */
    public addTool(toolYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/tools`, toolYamlObj).subscribe(
                (id: string) => {
                    resolve(id);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public addServer(serverYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/servers`, serverYamlObj).subscribe(
                (id: string) => {
                    resolve(id);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public addConfiguration(configurationYamlObj: any, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/configurations`, configurationYamlObj).subscribe(
                (id: string) => {
                    resolve(id);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public addTaskToConfiguration(configId: string, taskYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/config/configurations/${configId}/tasks`, taskYamlObj).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    /*
        UPDATING ITEMS 
    */
    public updateConfiguration(id: string, configurationYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/configurations/${id}`, configurationYamlObj).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public updateTask(configurationId: string, taskId: string, taskYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient
                .put(`${this.url}/projects/${projectName}/config/configurations/${configurationId}/tasks/${taskId}`, taskYamlObj)
                .subscribe(
                    () => {
                        resolve();
                    },
                    (err: HttpErrorResponse) => {
                        reject(err.error);
                    }
                );
        });
    }

    public updateTool(id: string, toolYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/tools/${id}`, toolYamlObj).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public updateServer(id: string, serverYamlObj: any, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.put(`${this.url}/projects/${projectName}/config/servers/${id}`, serverYamlObj).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    /*
        REMOVING ITEMS 
    */
    public removeTool(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/tools/${id}`).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public removeServer(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/servers/${id}`).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public removeConfiguration(id: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient.delete(`${this.url}/projects/${projectName}/config/configurations/${id}`).subscribe(
                () => {
                    resolve();
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public removeTaskFromConfiguration(configurationId: string, taskId: string, projectName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.httpClient
                .delete(`${this.url}/projects/${projectName}/config/configurations/${configurationId}/tasks/${taskId}`)
                .subscribe(
                    () => {
                        resolve();
                    },
                    (err: HttpErrorResponse) => {
                        reject(err.error);
                    }
                );
        });
    }

    /*
        CONFIGURATION EXECUTION
    */
    public executeConfiguration(configurationId: string, projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/execution/configurations/${configurationId}/run`, "").subscribe(
                (res) => {
                    resolve(res);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public stopExecution(configurationId: string, projectName: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.post(`${this.url}/projects/${projectName}/execution/configurations/${configurationId}/stop`, "").subscribe(
                (res) => {
                    resolve(res);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    public getExecutionStatus(configurationId: string, projectName: string): Promise<componentStatus[]> {
        return new Promise<componentStatus[]>((resolve, reject) => {
            this.httpClient.get(`${this.url}/projects/${projectName}/execution/configurations/${configurationId}/status`).subscribe(
                (res) => {
                    const status: componentStatus[] = Object.entries(res).map(
                        (entry) => ({ componentId: entry[0], status: entry[1] } as componentStatus)
                    );
                    resolve(status);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }

    /*
        OTHER API CALLS
    */
    public getSchemaDefinition(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.httpClient.get(`${this.url}//project/schema`).subscribe(
                (res) => {
                    resolve(res);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }
    public createFmuFromDataRepeater(configIndex: string, dataRepeaterIndex: string, projectName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.httpClient
                .post(`${this.url}/projects/${projectName}/prepare/config/configurations/${configIndex}/tasks/${dataRepeaterIndex}`, "")
                .subscribe(
                    (res) => {
                        resolve((res as IDataRepeaterResponse).file);
                    },
                    (err: HttpErrorResponse) => {
                        reject(err.error);
                    }
                );
        });
    }

    public getProjects(): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            this.httpClient.get(`${this.url}/projects`).subscribe(
                (res) => {
                    resolve(res as string[]);
                },
                (err: HttpErrorResponse) => {
                    reject(err.error);
                }
            );
        });
    }
}

export type componentStatus = {
    componentId: string;
    status: string;
};
