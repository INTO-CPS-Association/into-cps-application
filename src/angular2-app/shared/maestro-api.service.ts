import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from "@angular/core";
import { CoeProcess } from "../../coe-server-status/CoeProcess";
import { IntoCpsApp } from "../../IntoCpsApp";
import { map, timeout } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import * as http from "http"
import { SettingsService, SettingKeys } from "./settings.service";
import * as fs from 'fs'
import { timer } from 'rxjs';
const JSZip = require("jszip");

// Verificaiton DTO utilised by Maestro
interface IVerificationDTO {
    verifiedSuccessfully: boolean;
    uppaalModel: string;
    errorMessage: string;
};

// The json error format of Maestro
interface IVndError {
    logref: string;
    message: string;
}

export enum simulationEndpoints {
    simulate = "simulate",
    sigverSimulate = "sigverSimulate"
}

export enum maestroVersions {
    maestroV1 = 1,
    maestroV2 = 2
}

@Injectable({
    providedIn: 'root',
})
export class MaestroApiService implements OnDestroy {
    private _coe: CoeProcess;
    private _coeIsOnline = new Subject<boolean>();
    private _timerSubscription: Subscription;

    coeVersionNumber: string = "";
    coeUrl: string = "";

    constructor(private httpClient: HttpClient, private settings: SettingsService) {
        this.coeUrl = this.settings.get(SettingKeys.COE_URL);
        this._coe = IntoCpsApp.getInstance().getCoeProcess();
    }
    
    ngOnDestroy() {
        this._timerSubscription.unsubscribe();
    }

    startMonitoringOnlineStatus(callback: (n: boolean) => void): Subscription {
        if(!this._timerSubscription || this._timerSubscription.closed){
            this._timerSubscription = timer(0, 2000).subscribe(() => this.isCoeOnline());
        }
        return this._coeIsOnline.asObservable().subscribe(callback);
    }

    stopMonitoringOnlineStatus(subscription: Subscription) {
        subscription.unsubscribe();
        if(this._coeIsOnline.observers.length < 1){
            this._timerSubscription.unsubscribe();
        }
    }

    /* 
        Simulation API entry points methods
    */

    getCoeVersionNumber(): Promise<string> {
        return this.httpClient.get(`http://${this.coeUrl}/version`).pipe(timeout(2000), map((response: any) => {
            //This regex match expects the coe version number to have the format x.x.x
            this.coeVersionNumber = response.version.match('[\\d\\.]+')[0];
            return this.coeVersionNumber;
        })).toPromise();
    }

    stopSimulation(simulationSessionId: string): Promise<Response> {
        return new Promise<Response>((resolve, reject) => { 
            this.httpClient.get(`http://${this.coeUrl}/stopsimulation/${simulationSessionId}`)
            .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });  
    }

    launchCOE() {
        if (!this._coe.isRunning()) IntoCpsApp.getInstance().getCoeProcess().start();
    }

    createSimulationSession(): Promise<string>  {
        return new Promise<string> ((resolve, reject) => {
            this.httpClient.get(`http://${this.coeUrl}/createSession`).subscribe((response: any) => resolve(response.sessionId), (err: Response) => reject(err));
        });
    }

    uploadFmus(fmus: FormData, simulationSessionId: string): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/upload/${simulationSessionId}`, fmus)
                .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    initializeCoe(configJson: any, simulationSessionId: string): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/initialize/${simulationSessionId}`, configJson)
                        .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    getPlainResult(simulationSessionId: string): Promise<string> {
        return new Promise<string> ((resolve, reject) => {
            this.httpClient.get(`http://${this.coeUrl}/result/${simulationSessionId}/plain`, {responseType: 'text'})
            .subscribe((res) => resolve(res), (err: Response) => reject(err))
        });
    }

    getResults(resultsPath: string, simulationSessionId: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            var resultsStream = fs.createWriteStream(resultsPath);
            http.get(`http://${this.coeUrl}/result/${simulationSessionId}/zip`, (response: http.IncomingMessage) => {
            if(response.statusCode != 200) {
                reject(response);
            }  
            response.pipe(resultsStream);
                response.on('end', () => {
                   resolve();
                });
            });
        });
    }

    destroySession(simulationSessionId: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            http.get(`http://${this.coeUrl}/destroy/${simulationSessionId}`, (response: any) => {
                if (response.statusCode != 200) {
                    reject(response);
                } else {
                    resolve();
                }
            });
        });
    }

    simulate(simulationData: any, simulationEndpoint: simulationEndpoints, simulationSessionId: string): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/${simulationEndpoint}/${simulationSessionId}`, simulationData)
            .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    executeViaCLI(simulationSessionId: string): Promise<void>  {
        return new Promise<void> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/executeViaCLI/${simulationSessionId}`, {"executeViaCLI": true}).subscribe(() => resolve(), (err: Response) => reject(err));
        });
    }

    /* 
        Scenario verifier API entry points methods
    */

    generateScenario(extendedMultiModelObj: Object): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/generateAlgorithmFromMultiModel`, extendedMultiModelObj, { responseType: 'text' }).toPromise().then(response => {
                const blob = new Blob([response], { type: 'text/plain' });
                resolve(new File([blob], "masterModel.conf", { type: blob.type }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorJsonToMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    verifyAlgorithm(masterModelAsString: string): Promise<IVerificationDTO> {
        return new Promise<IVerificationDTO>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/verifyAlgorithm`, masterModelAsString).toPromise().then(response => {
                resolve(response as IVerificationDTO);
            }, (errorResponse: HttpErrorResponse) => {
                this.errorJsonToMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    visualizeTrace(masterModelAsString: string): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/visualizeTrace`, masterModelAsString).toPromise().then(response => {
                resolve(new File([response as Blob], "trace_visualization.mp4", { lastModified: new Date().getTime(), type: 'blob' }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorJsonToMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    /* 
        Non API methods
    */

    getWebSocketSessionUrl(simulationSessionId: string): string {
        return `ws://${this.coeUrl}/attachSession/${simulationSessionId}`;
    }

    getMaestroVersion(): maestroVersions {
        if(!this.coeVersionNumber) {
            return undefined;
        }

        let version: maestroVersions;

        switch(Number.parseInt(this.coeVersionNumber.split('.')[0])) {
            case 1: 
                version = maestroVersions.maestroV1;
                break;
            case 2: 
                version = maestroVersions.maestroV2;
                break;
        }

        if(!version){
            console.warn("Unknown Maestro version: " + this.coeVersionNumber);
        } 
        return version;
    }

    isRemoteCoe(): boolean {
        return this.settings.get(SettingKeys.COE_REMOTE_HOST);
    }

    getCoeProcess(): CoeProcess {
        if(!this._coe){
            this._coe = IntoCpsApp.getInstance().getCoeProcess();
        }
        return this._coe;
    }

    private isCoeOnline() {
        this.getCoeVersionNumber().then(() => this._coeIsOnline.next(true)).catch(() => this._coeIsOnline.next(false));
    }

    inferMaestroVersionFromJarContent(): Promise<maestroVersions> {
        return new Promise<maestroVersions> (async (resolve, reject) => {
            // read the contents of the maestro jar
            fs.readFile(this._coe.getCoePath(), (err, data) => {
                if (err) {
                    reject("Unable to infer maestro version from jar: " + err);
                } else {
                    JSZip.loadAsync(data).then((zip: any) => {
                        if(Object.keys(zip.files).findIndex(file => file.toLowerCase().endsWith(".mabl")) > -1){  
                            resolve(maestroVersions.maestroV2);
                        } else {
                            resolve(maestroVersions.maestroV1);
                        }
                    });
                }
            });
        });
    }

    private formatErrorMessage(statusCode: number, IVndErrors: IVndError[]): string {
        return statusCode + " => " + IVndErrors.map(vndErr => vndErr.message).reduce((msg, currMsg) => currMsg + "<" + msg + ">");
    }

    // Convert the error message returned from Maestro into a string format.
    private errorJsonToMsg(err: HttpErrorResponse): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (typeof err.error === "string") {
                const IVndErrors: IVndError[] = JSON.parse(err.error as string);
                resolve(this.formatErrorMessage(err.status, IVndErrors));;
            }
            else if (err.error instanceof Blob && err.error.type === "application/json") {
                const reader = new FileReader();
                reader.onload = (e: Event) => {
                    const IVndErrors: IVndError[] = JSON.parse((<any>e.target).result);
                    resolve(this.formatErrorMessage(err.status, IVndErrors));
                }
                reader.onerror = (e) => {
                    reject(err);
                };
                reader.readAsText(err.error);
            }
            else if (err.error.type === "application/json") {
                try {
                    resolve(this.formatErrorMessage(err.status, (err.error as IVndError[])));
                }
                catch (exc) {
                    reject(`Unable to convert to error format: ${exc}`);
                }
            }
            else {
                reject("Unable to convert to error format");
            }
        });
    }
}