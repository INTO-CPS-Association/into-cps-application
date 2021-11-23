import { Component, Input, OnDestroy } from "@angular/core";
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import * as Fs from 'fs';
import * as Path from 'path';
import { SigverConfigurationService as SigverConfigurationService } from "./sigver-configuration.service";
import { CoeApiService } from "../shared/coe-api.service";

@Component({
    selector: "sigver-coe-interaction",
    templateUrl: "./angular2-app/sigver/sigver-coe-interaction.component.html",
    providers: [CoeApiService]
})
export class SigverCoeInteractionComponent implements OnDestroy {
    private _configurationChangedSub: Subscription;
    private _coeIsOnlineSub: Subscription;

    videoUrl: any;

    @Input()
    generationresultspath: string = "";

    @Input()
    verificationresultspath: string = "";

    verificationErrMsg: string = "";

    // View state bools
    isVerificationFailed: boolean = false;
    isCoeOnline: boolean = false;
    isGeneratingTraces: boolean = false;
    isMasterModelValid: boolean = false;
    isVerified: boolean = false;
    isGeneratingMasterModel: boolean = false;
    isVerifying: boolean = false;

    constructor(private coeApiService: CoeApiService, private sanitizer: DomSanitizer, private sigverConfigurationService: SigverConfigurationService) {
        this._coeIsOnlineSub = coeApiService.coeIsOnlineObservable.subscribe(isOnline => this.isCoeOnline = isOnline);

        this._configurationChangedSub = this.sigverConfigurationService.configurationChangedObservable.subscribe(() => {
            this.handleConfigurationChanges();
        });
    }

    ngOnDestroy(): void {
        this._coeIsOnlineSub.unsubscribe();
        this._configurationChangedSub.unsubscribe();
    }

    onGenerateMasterModelClick() {
        this.isGeneratingMasterModel = true;
        this.coeApiService.generateScenario(this.sigverConfigurationService.configurationToExtendedMultiModelDTO()).then(masterModelFile => {
            masterModelFile.text().then(masterModel => {
                this.sigverConfigurationService.configuration.masterModel = masterModel;
                this.sigverConfigurationService.configurationChanged();
                this.sigverConfigurationService.saveConfiguration();
                this.isMasterModelValid = true;
            });
            this.writeFileToDir(masterModelFile, this.generationresultspath);
        }, errMsg => {
            console.error(`Error occurred when generating the master model: ${errMsg}`);
        }).finally(() => {
            this.isGeneratingMasterModel = false;
        });
    }

    onVerifyClick() {
        this.isVerifying = true;
        this.coeApiService.verifyAlgorithm(this.sigverConfigurationService.configuration.masterModel).then(res => {
            this.isVerified = true;
            this.isVerificationFailed = !res.verifiedSuccessfully;
            if (this.isVerificationFailed) {
                this.verificationErrMsg = res.errorMessage;
            }
            const blob = new Blob([res.uppaalModel], { type: 'text/plain' });
            const uppaalFile = new File([blob], "uppaalModel.xml", { type: blob.type });
            this.writeFileToDir(uppaalFile, this.verificationresultspath);
        }, errMsg => {
            console.error(`Error occurred when verifying the master model: ${errMsg}`);
        }).finally(() => {
            this.isVerifying = false;
        });
    }

    onVisualizeTracesClick() {
        this.isGeneratingTraces = true;
        this.coeApiService.visualizeTrace(this.sigverConfigurationService.configuration.masterModel).then(videoFile => {
            this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(videoFile));
            this.writeFileToDir(videoFile, this.verificationresultspath);
        }, errMsg => {
            console.error(`Error occurred when visualizing traces: ${errMsg}`);
        }).finally(() => this.isGeneratingTraces = false).finally(() => {
            this.isGeneratingTraces = false;
        });
    }

    handleConfigurationChanges() {
        this.isMasterModelValid = this.sigverConfigurationService.configuration.masterModel != "";
        this.isVerified = this.isMasterModelValid && this.isVerified;
        this.isVerificationFailed = this.isVerified ? this.isVerificationFailed : false;
        if (!this.isVerificationFailed) {
            this.videoUrl = null;
        }
    }

    writeFileToDir(file: File, dirPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            file.arrayBuffer().then(arrBuff => {
                const writeStream = Fs.createWriteStream(Path.join(dirPath, file.name));
                writeStream.write(Buffer.from(arrBuff));
                writeStream.close();
                resolve();
            }).catch(err => reject(`Error occurred when writing file to path ${dirPath}: ${err}`));
        });
    }
}