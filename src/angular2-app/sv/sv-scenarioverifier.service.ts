import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from "@angular/core";
import { CoeProcess } from "../../coe-server-status/CoeProcess";
import { IntoCpsApp } from "../../IntoCpsApp";
import {map, timeout} from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SettingsService, SettingKeys } from "../shared/settings.service";

interface IVerificationDTO {
    verifiedSuccessfully: boolean;
    errorMessage: string;
};

@Injectable()
export class SvScenarioVerifierService implements OnDestroy {
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
        return new Promise<string>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/generateAlgorithmFromMultiModel`, extendedMultiModelObj, {responseType: 'text'}).toPromise().then(res => {
                resolve(res as string)
            }, err => {
                reject(err)
            })
        });
    }

    execute(executionDTOObj: Object){
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/executeAlgorithm`, executionDTOObj, {responseType: 'blob'}).toPromise().then(res => {
                let fileName = "executionResults.zip"

                var file = new File([res], fileName, { lastModified: new Date().getTime(), type: res.type })
                resolve(file)
            }, err => {
                reject(err)
            })
        });
    }

    verifyAlgorithm(masterModelAsString: string){
        return new Promise<IVerificationDTO>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/verifyAlgorithm`, masterModelAsString).toPromise().then(res => {
                resolve(res as IVerificationDTO)
            }, err => {
                reject(err)
            })
        });
    }

    visualizeTrace(masterModelAsString: string){
        return new Promise<File>((resolve, reject) => {
            this.httpClient.post(`http://${this.coeUrl}/visualizeTrace`, masterModelAsString, {responseType:'blob'}).toPromise().then(async res => {
                let fileName = "traceVisualization.mp4"

                var file = new File([res], fileName, { lastModified: new Date().getTime(), type: res.type })
                resolve(file)
            }, err => {
                reject(err)
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
}