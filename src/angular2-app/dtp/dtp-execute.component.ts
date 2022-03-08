import { Component, Input, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import IntoCpsApp from "../../IntoCpsApp";
import { DTPConfig, TaskConfigurationDtpItem } from "./dtp-configuration";
import { DtpDtToolingService, componentStatus } from "./dtp-dt-tooling.service";

@Component({
    selector: "dtp-execute",
    templateUrl: "./angular2-app/dtp/dtp-execute.component.html",
})
export class DtpExecuteComponent implements OnDestroy {
    private _statusTimerTimeout: NodeJS.Timeout;
    private isToolingServerOnlineSub: Subscription;
    private _config: DTPConfig;
    private isServerOnline: boolean = false;
    protected readonly executingConfigurationToStatus: Map<TaskConfigurationDtpItem, componentStatus[]> = new Map();
    protected selectedConfiguration: TaskConfigurationDtpItem;

    @Input()
    set config(config: DTPConfig) {
        this._config = config;

        if (config && this._config.configurations.length > 0) {
            this.selectedConfiguration = this._config.configurations[0] as TaskConfigurationDtpItem;
        }
    }
    get config(): DTPConfig {
        return this._config;
    }

    constructor(private dtpToolingService: DtpDtToolingService) {
        this.isToolingServerOnlineSub = dtpToolingService.isOnlineObservable.subscribe((isOnline) => {
            this.isServerOnline = isOnline;
        });
    }
    ngOnDestroy(): void {
        this.isToolingServerOnlineSub.unsubscribe();
    }

    protected getSelectableConfigurations(): TaskConfigurationDtpItem[] {
        return this._config.configurations.filter(
            (config) => !Array.from(this.executingConfigurationToStatus.keys()).find((ceConf) => ceConf == config)
        );
    }

    protected stopExecution(configuration: TaskConfigurationDtpItem) {
        this.dtpToolingService
            .stopExecution(configuration.id, this._config.projectName)
            .then(() => this.executionStopped(configuration))
            .catch((err) => console.warn(err));
    }

    protected startExecution(configuration: TaskConfigurationDtpItem) {
        this.dtpToolingService
            .executeConfiguration(configuration.id, this._config.projectName)
            .then(() => console.log(`Finished executing ${configuration.name}`))
            .catch((err) => console.warn(err))
            .finally(() => this.executionStopped(configuration));
        this.executingConfigurationToStatus.set(configuration, []);
        if (this.executingConfigurationToStatus.size == 1) {
            this._statusTimerTimeout = setInterval(() => this.updateStatusForExecutingConfigs(), 2000);
        }

        // Update selection to the next available configuration
        if (this.getSelectableConfigurations().length > 0) {
            this.selectedConfiguration = this.getSelectableConfigurations()[0];
        }
    }

    protected canRunConfiguration(): boolean {
        return (
            this.isServerOnline && this.getSelectableConfigurations().length > 0 && this.getSelectableConfigurations()[0].isCreatedOnServer
        );
    }

    private updateStatusForExecutingConfigs() {
        this.executingConfigurationToStatus.forEach((statusTypes, ceConfig) =>
            this.dtpToolingService.getExecutionStatus(ceConfig.id, this._config.projectName).then((res) => {
                if (this.executingConfigurationToStatus.has(ceConfig)) {
                    this.executingConfigurationToStatus.set(ceConfig, res);
                }
            })
        );
    }

    private executionStopped(configuration: TaskConfigurationDtpItem) {
        this.executingConfigurationToStatus.delete(configuration);

        if (this.executingConfigurationToStatus.size == 0) {
            clearInterval(this._statusTimerTimeout);
        }
    }
}
