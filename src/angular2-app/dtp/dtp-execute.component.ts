import { Component, Input } from "@angular/core";
import { DTPConfig, TaskConfigurationDtpItem } from "./dtp-configuration";
import { DtpDtToolingService } from "./dtp-dt-tooling.service";

@Component({
    selector: "dtp-execute",
    templateUrl: "./angular2-app/dtp/dtp-execute.component.html"
})
export class DtpExecuteComponent {
    public isRunning: boolean = false;
    private _config: DTPConfig;
    private selectedConfiguration: TaskConfigurationDtpItem;

    @Input()
    set config(config: DTPConfig){
        this._config = config;

        if (config && this._config.configurations.length > 0)  {
            this.selectedConfiguration = this._config.configurations[0] as TaskConfigurationDtpItem;
        }
       
    }
    get config(): DTPConfig {
        return this._config;
    }

    constructor(private dtpToolingService: DtpDtToolingService) {

    }

    private execute(){
        this.dtpToolingService.runConfiguration(this.selectedConfiguration.name, this._config.projectName).then(() => console.log("Finished excuting!")).catch(err => console.warn(err));
        console.log("EXECUTING!");
    }

}