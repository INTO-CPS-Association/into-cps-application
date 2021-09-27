import {Component, OnDestroy} from "@angular/core";
import { SvScenarioVerifierService } from "./sv-scenarioverifier.service";
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import { SvConfigurationService } from "./sv-configuration.service";

@Component({
    selector: "sv-coe-interaction",
    templateUrl: "./angular2-app/sv/sv-coe-interaction.component.html",
    providers: [SvScenarioVerifierService]
})
export class SvCoeInteractionComponent implements OnDestroy{
    private _configurationChangedSub: Subscription;
    private _coeIsOnlineSub: Subscription;

    coeUrl: string = "";
    coeVersion: string = "";
    videoUrl: any;
    rootrResultsPath: string = "";
    generationResultsPath: string = "";
    verificationResultsPath: string = "";
    executionResultsPath: string = "";
    verificationErrMsg: string = "";

    // View state bools
    isVerificationFailed: boolean = false;
    isConfigValid: boolean = false;
    isCoeOnline: boolean = false;
    isGeneratingTraces: boolean = false;
    isMasterModelValid: boolean = false;
    isExecutionSuccess: boolean = false;
    isVerified: boolean = false;
    isExecuting: boolean = false;
    isGeneratingMasterModel: boolean = false;
    isVerifying: boolean = false;
    
    constructor(private svService: SvScenarioVerifierService, private sanitizer : DomSanitizer, private svConfigurationService: SvConfigurationService) {
        this.coeUrl = svService.coeUrl;
        this.coeVersion = svService.coeVersion;
        this._coeIsOnlineSub = svService.coeIsOnlineObservable.subscribe(isOnline => {
            this.isCoeOnline = isOnline;
            if(isOnline){
                this.coeUrl = svService.coeUrl;
                this.coeVersion = svService.coeVersion;
            }
        });

        this._configurationChangedSub = this.svConfigurationService.configurationChangedObservable.subscribe(() => {
            this.handleConfigurationChanges();
        });
    }

    ngOnDestroy(): void {
        this._coeIsOnlineSub.unsubscribe();
        this._configurationChangedSub.unsubscribe();
    }

    onCoeLaunchClick() {
        this.svService.launchCOE();
    }

    onGenerateMasterModelClick() {
        this.isGeneratingMasterModel = true;
        this.svService.generateScenario(this.svConfigurationService.configurationToExtendedMultiModelDTO()).then(scenarioFile => {
            scenarioFile.text().then(txt => {
                this.svConfigurationService.configuration.masterModel = txt;
                this.svConfigurationService.saveConfiguration();
                this.isMasterModelValid = true;
            });
            this.ensureResultPaths();
            this.writeFileToDir(scenarioFile, this.generationResultsPath);
        }, errMsg => {
            console.error(`Error occurred when generating the master model: ${errMsg}`);
        }).finally(() => {
            this.isGeneratingMasterModel = false;
        });
    }

    onVerifyClick() {
        this.isVerifying = true;
        this.svService.verifyAlgorithm(this.svConfigurationService.configuration.masterModel).then(res => {
            this.isVerified = true;
            this.isVerificationFailed = !res.verifiedSuccessfully;
            if(this.isVerificationFailed){
                this.verificationErrMsg = res.errorMessage;
            }
            const blob = new Blob([res.uppaalModel], { type: 'text/plain' });
            const uppaalFile = new File([blob], "uppaalModel.xml", {type: blob.type});
            this.ensureResultPaths();
            this.writeFileToDir(uppaalFile, this.verificationResultsPath);
        }, errMsg => {
            console.error(`Error occurred when verifying the master model: ${errMsg}`);
        }).finally(() => {
            this.isVerifying = false;
        });
    }

    onVisualizeTracesClick() {
        this.isGeneratingTraces = true;
        const masterModelAsString = fs.readFileSync('C:\\Users\\frdrk\\Desktop\\Repos\\maestroDev\\external_tester\\scenario_controller_resources\\visualize_traces\\masterModel.conf','utf8');
        this.svService.visualizeTrace(masterModelAsString).then(videoFile => { //this.svConfigurationService.configuration.masterModel
            this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(videoFile));
            this.ensureResultPaths();
            this.writeFileToDir(videoFile, this.verificationResultsPath);
        }, errMsg => {
            console.error(`Error occurred when visualizing traces: ${errMsg}`);
        }).finally(() => this.isGeneratingTraces = false).finally(() => {
            this.isGeneratingTraces = false;
        });
    }

    onExecuteClick() {
        this.isExecuting = true;
        this.isExecutionSuccess = false;
        this.svService.execute(this.svConfigurationService.configurationToExecutableMMDTO(!this.isVerified)).then(zipFile => {
            this.isExecutionSuccess = true;
            this.ensureResultPaths();
            this.writeFileToDir(zipFile, this.executionResultsPath);
        }, errMsg => {
            this.isExecutionSuccess = false;
            console.error(`Error occurred when executing the master model: ${errMsg}`);
        }).finally(() => {
            this.isExecuting = false;
        });
    }

    ensureResultPaths() {
        if(this.rootrResultsPath == ""){
            this.rootrResultsPath = path.join(this.svConfigurationService.configurationPath, "..", "results", path.sep);

            this.verificationResultsPath = path.join(this.rootrResultsPath, "verification");
            this.executionResultsPath = path.join(this.rootrResultsPath, "execution");
            this.generationResultsPath = path.join(this.rootrResultsPath, "generation");

            this.ensureDirectoryExistence(this.verificationResultsPath).catch(err => console.log(err));
            this.ensureDirectoryExistence(this.executionResultsPath).catch(err => console.log(err));
            this.ensureDirectoryExistence(this.generationResultsPath).catch(err => console.log(err));
        }
    }

    handleConfigurationChanges(){
        this.isConfigValid = this.svConfigurationService.isConfigValid();
        this.isMasterModelValid = this.svConfigurationService.configuration.masterModel != "";
        this.isVerified = this.isMasterModelValid && this.isVerified;
        this.isVerificationFailed = this.isVerified ? this.isVerificationFailed : false;
        if(!this.isVerificationFailed){
            this.videoUrl = null;
        }
    }

    ensureDirectoryExistence(filePath: string): Promise<void> {
        return new Promise<void> ((resolve, reject) => {
            if(fs.existsSync(filePath)){
                resolve();
            }
            fs.promises.mkdir(filePath, { recursive: true }).then(() => {
                resolve();
            }, err => {
                reject(err);
            });
        });
    }

    writeFileToDir(file: File, dirPath: string) {
        file.arrayBuffer().then(arrBuff => {
            const writeStream = fs.createWriteStream(path.join(dirPath, file.name));
            writeStream.write(Buffer.from(arrBuff));
            writeStream.close();
        }).catch(err => console.error(`Error occurred when writing file to path ${dirPath}: ${err}`));
    }
}