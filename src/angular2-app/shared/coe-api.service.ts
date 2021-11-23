import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from "@angular/core";
import { CoeProcess } from "../../coe-server-status/CoeProcess";
import { IntoCpsApp } from "../../IntoCpsApp";
import { map, timeout } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as http from "http"
import { SettingsService, SettingKeys } from "../shared/settings.service";
import * as fs from 'fs'

interface IVerificationDTO {
    verifiedSuccessfully: boolean;
    uppaalModel: string;
    errorMessage: string;
};

interface IVndError {
    logref: string;
    message: string;
}

export enum simulationEndpoints {
    simulate = "simulate",
    sigverSimulate = "sigverSimulate"
}

@Injectable()
export class CoeApiService implements OnDestroy {
    private _coe: CoeProcess;
    private _onlineInterval: number;
    private _coeIsOnline = new Subject<boolean>();
    protected simulationSessionId: string;

    coeVersionNumber: string = "";
    coeUrl: string = "";
    coeIsOnlineObservable = this._coeIsOnline.asObservable();

    constructor(private httpClient: HttpClient, private settings: SettingsService) {
        this.coeUrl = this.settings.get(SettingKeys.COE_URL);
        this._onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    getWebSocketSessionUrl(): string {
        return `ws://${this.coeUrl}/attachSession/${this.simulationSessionId}`;
    }

    getCoeVersion(): number {
        if(!this.coeVersionNumber) {
            return -1;
        }
        return Number.parseInt(this.coeVersionNumber.split('.')[0]);
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

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
    }

    /* 
        Simulation API entry points 
    */

    stopSimulation(): Promise<Response> {
        return new Promise<Response>((resolve, reject) => { 
            this.httpClient.get(`http://${this.coeUrl}/stopsimulation/${this.simulationSessionId}`)
            .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });  
    }

    launchCOE() {
        this._coe = IntoCpsApp.getInstance().getCoeProcess();
        if (!this._coe.isRunning()) IntoCpsApp.getInstance().getCoeProcess().start();
    }

    createSimulationSession(): Promise<string>  {
        return new Promise<string> ((resolve, reject) => {
            this.httpClient.get(`http://${this.coeUrl}/createSession`).subscribe((response: any) => resolve(response.sessionId), (err: Response) => reject(err));
        });
    }

    uploadFmus(fmus: FormData): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/upload/${this.simulationSessionId}`, fmus)
                .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    initializeCoe(configJson: any): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/initialize/${this.simulationSessionId}`, configJson)
                        .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    getPlainResult(): Promise<string> {
        return new Promise<string> ((resolve, reject) => {
            this.httpClient.get(`http://${this.coeUrl}/result/${this.simulationSessionId}/plain`, {responseType: 'text'})
            .subscribe((res) => resolve(res), (err: Response) => reject(err))
        });
    }

    getResults(resultsPath: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            var resultsStream = fs.createWriteStream(resultsPath);
            http.get(`http://${this.coeUrl}/result/${this.simulationSessionId}/zip`, (response: http.IncomingMessage) => {
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

    destroySession(): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            http.get(`http://${this.coeUrl}/destroy/${this.simulationSessionId}`, (response: any) => {
                if (response.statusCode != 200) {
                    reject(response);
                } else {
                    resolve();
                }
            });
        });
    }

    simulate(simulationData: any, simulationEndpoint: simulationEndpoints): Promise<Response> {
        return new Promise<Response> ((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/${simulationEndpoint}/${this.simulationSessionId}`, simulationData)
            .subscribe((res: Response) => { resolve(res) }, (err: Response) => reject(err));
        });
    }

    /* 
        Scenario verifier API entry points 
    */

    generateScenario(extendedMultiModelObj: Object): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/generateAlgorithmFromMultiModel`, extendedMultiModelObj, { responseType: 'text' }).toPromise().then(response => {
                const blob = new Blob([response], { type: 'text/plain' });
                resolve(new File([blob], "masterModel.conf", { type: blob.type }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    verifyAlgorithm(masterModelAsString: string): Promise<IVerificationDTO> {
        return new Promise<IVerificationDTO>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/verifyAlgorithm`, masterModelAsString).toPromise().then(response => {
                resolve(response as IVerificationDTO);
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    visualizeTrace(masterModelAsString: string): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/visualizeTrace`, masterModelAsString).toPromise().then(response => { //, {responseType:'blob'}
                resolve(new File([response as Blob], "trace_visualization.mp4", { lastModified: new Date().getTime(), type: 'blob' }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => { console.log(err); reject(errorResponse.message) });
            })
        });
    }

    isCoeOnline() {
        this.httpClient.get(CoeProcess.getCoeVersionUrl()).pipe(timeout(2000), map(response => response))
            .subscribe(
                (data: any) => {
                    //This regex match expects the coe version number to be on the format X.X.X
                    this.coeVersionNumber = data.version.match('[\\d\\.]+');
                    this._coeIsOnline.next(true);
                },
                () => (this._coeIsOnline.next(false))
            );
    }

    private formatErrorMessage(statusCode: number, IVndErrors: IVndError[]): string {
        return statusCode + " => " + IVndErrors.map(vndErr => vndErr.message).reduce((msg, currMsg) => currMsg + "<" + msg + ">");
    }

    private errorToJsonMsg(err: HttpErrorResponse): Promise<string> {
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