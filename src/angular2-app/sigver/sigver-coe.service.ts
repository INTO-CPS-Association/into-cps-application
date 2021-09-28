import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from "@angular/core";
import { CoeProcess } from "../../coe-server-status/CoeProcess";
import { IntoCpsApp } from "../../IntoCpsApp";
import {map, timeout} from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SettingsService, SettingKeys } from "../shared/settings.service";

interface IVerificationDTO {
    verifiedSuccessfully: boolean;
    uppaalModel: string;
    errorMessage: string;
};

interface IVndError {
    logref: string;
    message: string;
}

@Injectable()
export class SigverCoeService implements OnDestroy {
    private _coe: CoeProcess;
    private _onlineInterval: number;
    private _coeIsOnline = new Subject<boolean>();

    coeVersion: string = "";
    coeUrl: string = "";
    coeIsOnlineObservable = this._coeIsOnline.asObservable();

    constructor(private httpClient: HttpClient, private settings: SettingsService){
        this.coeUrl = this.settings.get(SettingKeys.COE_URL);
        this._onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this._onlineInterval);
    }

    launchCOE() {
        this._coe = IntoCpsApp.getInstance().getCoeProcess();
        if (!this._coe.isRunning()) IntoCpsApp.getInstance().getCoeProcess().start();
    }

    generateScenario(extendedMultiModelObj: Object){
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/generateAlgorithmFromMultiModel`, extendedMultiModelObj, {responseType: 'text'}).toPromise().then(response => {
                const blob = new Blob([response], { type: 'text/plain' });
                resolve(new File([blob], "masterModel.conf", {type: blob.type}));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => {console.log(err); reject(errorResponse.message) });
            })
        });
    }

    execute(executionDTOObj: Object){
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/executeAlgorithm`, executionDTOObj, {responseType: 'blob'}).toPromise().then(response => {
                resolve(new File([response], "execution_results.zip", { lastModified: new Date().getTime(), type: response.type }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => {console.log(err); reject(errorResponse.message) });
            })
        });
    }

    verifyAlgorithm(masterModelAsString: string){
        return new Promise<IVerificationDTO>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/verifyAlgorithm`, masterModelAsString).toPromise().then(response => {
                resolve(response as IVerificationDTO);
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => {console.log(err); reject(errorResponse.message) });
            })
        });
    }

    visualizeTrace(masterModelAsString: string){
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/visualizeTrace`, masterModelAsString).toPromise().then(response => { //, {responseType:'blob'}
                resolve(new File([response as Blob], "trace_visualization.mp4", { lastModified: new Date().getTime(), type: 'blob' }));
            }, (errorResponse: HttpErrorResponse) => {
                this.errorToJsonMsg(errorResponse).then(msg => reject(msg)).catch(err => {console.log(err); reject(errorResponse.message) });
            })
        });
    }

    isCoeOnline() {
        this.httpClient.get(CoeProcess.getCoeVersionUrl()).pipe(timeout(2000), map(response => response))
          .subscribe(
            (data: any) => {
            this.coeVersion = data.version;
            this._coeIsOnline.next(true);
            },
            () => (this._coeIsOnline.next(false))
        );
    }

    private formatErrorMessage(statusCode: number, IVndErrors: IVndError[]): string {
        return statusCode + " => " + IVndErrors.map(vndErr => vndErr.message).reduce((msg, currMsg) => currMsg + "<" + msg + ">");
    }

    private errorToJsonMsg(err: HttpErrorResponse): Promise<string> {
        return new Promise<string> ((resolve, reject) => {
            if (typeof err.error === "string") {
                const IVndErrors: IVndError[] = JSON.parse(err.error as string);
                resolve(this.formatErrorMessage(err.status, IVndErrors));;
            }
            else if(err.error instanceof Blob && err.error.type === "application/json") {
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
            else if(err.error.type === "application/json") {
                try{
                    resolve(this.formatErrorMessage(err.status, (err.error as IVndError[])));
                }
                catch(exc){
                    reject(`Unable to convert to error format: ${exc}`);
                }
            }
            else {
                reject("Unable to convert to error format");
            }
        }); 
    }
}