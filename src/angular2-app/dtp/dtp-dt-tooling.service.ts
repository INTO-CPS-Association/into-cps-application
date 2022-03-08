import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { remote } from "electron";

export interface IDataRepeaterResponse {
    file: string;
    signals: Object;
}

@Injectable()
export class DtpDtToolingService implements OnDestroy {
    private _isOnlineSubject = new Subject<boolean>();
    private _onlineInterval: number;
    private static _serverProc: ChildProcessWithoutNullStreams;
    public readonly url: string = "http://localhost/"; // http://127.0.0.1:5000/
    public readonly isOnlineObservable: Observable<boolean> = this._isOnlineSubject.asObservable();
    public latestServerOnlineStatus: boolean = false;

    constructor(private httpClient: HttpClient) {
        this._onlineInterval = window.setInterval(() => this.updateServerOnlineStatus(), 2000);
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
    }

    public spawnServer(baseDir: string): boolean {
        if (DtpDtToolingService._serverProc) {
            console.log(`DT tooling server is already running with PID: ${DtpDtToolingService._serverProc.pid}`);
            return true;
        }

        DtpDtToolingService._serverProc = spawn(process.platform != "win32" ? "python3" : "python", [
            "-m",
            "digital_twin_tooling",
            "webapi",
            "-base",
            `${baseDir}`,
        ]);
        if (!DtpDtToolingService._serverProc || !DtpDtToolingService._serverProc.pid) {
            console.error("Unable to start DT tooling sever. Ensure that python is in path.");
            return false;
        }
        console.log(`DT tooling webserver PID: ${DtpDtToolingService._serverProc.pid}`);

        remote.getCurrentWindow().on("close", () => this.stopServer());

        return true;
    }

    private stopServer() {
        if (!DtpDtToolingService._serverProc) {
            return;
        }
        const pid: string = DtpDtToolingService._serverProc?.pid.toString() ?? "??";

        this.getShutdownServer()
            .then((shutdownMsg) => console.log(`Stopping DT tooling server with PID: ${pid}. Server shutdown msg: ${shutdownMsg}`))
            .catch((err) => console.warn(err));

        DtpDtToolingService._serverProc = null;
    }

    public updateServerOnlineStatus(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.httpClient
                .get(`${this.url}/`, { responseType: "text" })
                .toPromise()
                .then(() => {
                    this._isOnlineSubject.next(true);
                    this.latestServerOnlineStatus = true;
                })
                .catch(() => {
                    this._isOnlineSubject.next(false);
                    this.latestServerOnlineStatus = false;
                })
                .finally(() => resolve(this.latestServerOnlineStatus));
        });
    }

    /*
        SERVER CONTROLS
    */
    public getShutdownServer(): Promise<string> {
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

    /*
        GET, CREATE, REMOVE PROJECT
    */
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
        ADDITIONAL API CALLS
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
}

export type componentStatus = {
    componentId: string;
    status: string;
};
