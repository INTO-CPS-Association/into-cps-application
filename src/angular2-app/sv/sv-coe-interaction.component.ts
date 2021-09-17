import {Component, OnDestroy} from "@angular/core";
import { SvConfiguration, Reactivity } from "../../intocps-configurations/sv-configuration";
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

    private readonly SCENARIOVERIFIER_TAG: string = "scenarioVerifier";
    private readonly VERIFICATION_TAG: string = "verification";
    private readonly TRACEVISUALIZATION_TAG: string = "traceVisualization";
    private _configurationChangedSub: Subscription;
    private _coeIsOnlineSub: Subscription;

    coeIsOnline: boolean = false;
    coeUrl: string = "";
    coeVersion: string = "";
    
    isVerified = false;
    videoUrl: any;
    resultsPath: string = "C:\\Users\\au535871\\Desktop\\results";
    isGeneratingTraces: boolean = false;
    shouldVerifyBeforeExecution: boolean = false;
    isMasterModelValid: boolean = false;
    configIsInvalid: boolean = true;
    isExecuted: boolean = false;
    masterModel: string = "";

    constructor(private svService: SvScenarioVerifierService, private sanitizer : DomSanitizer, private svConfigurationService: SvConfigurationService) {
        this.coeUrl = svService.coeUrl;
        this.coeVersion = svService.coeVersion;
        this._coeIsOnlineSub = svService.coeIsOnlineObservable.subscribe(isOnline => {
            this.coeIsOnline = isOnline
            if(isOnline){
                this.coeUrl = svService.coeUrl;
                this.coeVersion = svService.coeVersion;
            }
        });

        this._configurationChangedSub = this.svConfigurationService.configurationChangedObservable.subscribe(() => {
            this.isMasterModelValid = this.svConfigurationService.configuration.masterModel != "" && !this.svConfigurationService.reactivityChanged;
            this.isVerified = this.isMasterModelValid && this.isVerified;
            this.configIsInvalid = !this.svConfigurationService.isConfigValid();
            this.isExecuted = false;
            if(this.isMasterModelValid){
                this.masterModel = this.svConfigurationService.configuration.masterModel;
            }
        });
    }
    
    configurationToExtendedMultiModelDTO(): any{
        const extendedMultiModelDTO = this.svConfigurationService.configuration.multiModel.toObject();
        let fmus: any = {};
        this.svConfigurationService.configuration.multiModel.fmus.forEach(fmu => {
            let fmuPath;
            if (fmu.isNested())
            {
                fmuPath = "coe:/" + fmu.path;
            }
            else
            {
                fmuPath = "file:///" + fmu.path
            }
            fmus[fmu.name] = fmuPath.replace(/\\/g, "/").replace(/ /g, "%20");
        });
        extendedMultiModelDTO["fmus"] = fmus;

        const reactivity: { [key: string]: Reactivity } = {};
        this.svConfigurationService.configuration.reactivity.forEach((value: Reactivity, key: string) => (reactivity[key] = value));

        const scenarioVerifierDTO: any = {}
        scenarioVerifierDTO[SvConfiguration.REACTIVITY_TAG] = reactivity;
        scenarioVerifierDTO[this.VERIFICATION_TAG] = this.shouldVerifyBeforeExecution;
        scenarioVerifierDTO[this.TRACEVISUALIZATION_TAG] = false;

        extendedMultiModelDTO[this.SCENARIOVERIFIER_TAG] = scenarioVerifierDTO;

        return extendedMultiModelDTO
    }

    configurationToExecutableMMDTO(): any {
        const executableMMDTO: any = {}
        executableMMDTO[SvConfiguration.MASTERMODEL_TAG] = this.svConfigurationService.configuration.masterModel;
        executableMMDTO[SvConfiguration.MULTIMODEL_TAG] = this.configurationToExtendedMultiModelDTO();
        executableMMDTO[SvConfiguration.EXECUTIONPARAMETERS_TAG] = this.svConfigurationService.configuration.simulationEnvironmentParameters;
        return executableMMDTO;
    }

    ngOnDestroy(): void {
        this._coeIsOnlineSub.unsubscribe();
        this._configurationChangedSub.unsubscribe();
    }

    onCoeLaunchClick() {
        this.svService.launchCOE();
    }

    onGenerateMasterModelClick() {
        this.svService.generateScenario(this.configurationToExtendedMultiModelDTO()).then(res => {
            this.svConfigurationService.configuration.masterModel = res;
            this.masterModel = this.svConfigurationService.configuration.masterModel;
            this.svConfigurationService.saveConfiguration();
            this.isMasterModelValid = true;
            this.isVerified = false;
            this.isExecuted = false;
        }, err => {});
    }

    onVerifyClick() {
        this.svService.verifyAlgorithm(this.svConfigurationService.configuration.masterModel).then(res => {
            this.isVerified = res.verifiedSuccessfully;
            if(!res.verifiedSuccessfully){
                // TODO: Handle verification failed
                res.errorMessage
            }
        }, err => {});
    }

    onVisualizeTracesClick() {
        this.isGeneratingTraces = true;
        const masterModelAsString = fs.readFileSync('C:\\Users\\frdrk\\Desktop\\Repos\\maestroDev\\external_tester\\scenario_controller_resources\\visualize_traces\\masterModel.conf','utf8');

        this.svService.visualizeTrace(masterModelAsString).then(async videoFile => {
            this.writeFileToResultsPath(videoFile);

            this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(videoFile));
        }, err => {
            // TODO: Handle unable to generate traces
            
        }).finally(() => this.isGeneratingTraces = false);
    }

    onExecuteClick() {
        this.svService.execute(this.configurationToExecutableMMDTO()).then(async zipFile => {
            this.writeFileToResultsPath(zipFile);
            this.isExecuted = true;
        }, err => {});
    }

    async writeFileToResultsPath(file: File) {
        fs.writeFile(path.join(this.resultsPath, file.name), Buffer.from( await file.arrayBuffer() ), function(err){
            if(err){
                // TODO: Handle unable to save file
            };
        });
    }
}