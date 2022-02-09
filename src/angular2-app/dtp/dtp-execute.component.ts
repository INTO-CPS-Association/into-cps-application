import { Component, Input } from "@angular/core";
import { DTPConfig, TaskConfigurationDtpItem } from "./dtp-configuration";
import { DtpDtToolingService, componentStatus } from "./dtp-dt-tooling.service";

@Component({
    selector: "dtp-execute",
    templateUrl: "./angular2-app/dtp/dtp-execute.component.html",
})
export class DtpExecuteComponent {
    private _statusTimerTimeout: NodeJS.Timeout;
    private _config: DTPConfig;
    protected readonly executingConfigurationToStatus: Map<TaskConfigurationDtpItem, componentStatus[]> = new Map();
    protected selectedConfiguration: TaskConfigurationDtpItem;
    protected canRunConfiguration: boolean = false;

    @Input()
    set config(config: DTPConfig) {
        this._config = config;

        if (config && this._config.configurations.length > 0) {
            this.selectedConfiguration = this._config.configurations[0] as TaskConfigurationDtpItem;
        }
        this.canRunConfiguration = this.getSelectableConfigurations().length > 0;
    }
    get config(): DTPConfig {
        return this._config;
    }

    constructor(private dtpToolingService: DtpDtToolingService) {}

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
        if (this.executingConfigurationToStatus.size <= 1) {
            this._statusTimerTimeout = setInterval(() => this.updateStatusForExecutingConfigs(), 2000);
        }
        this.canRunConfiguration = this.getSelectableConfigurations().length > 0;
    }

    private updateStatusForExecutingConfigs() {
        this.executingConfigurationToStatus.forEach((statusTypes, ceConfig) =>
            this.dtpToolingService
                .getExecutionStatus(ceConfig.id, this._config.projectName)
                .then((res) => this.executingConfigurationToStatus.set(ceConfig, res))
        );
    }

    private executionStopped(configuration: TaskConfigurationDtpItem) {
        this.executingConfigurationToStatus.delete(configuration);
        this.canRunConfiguration = true;

        if (this._statusTimerTimeout && this.executingConfigurationToStatus.size == 0) {
            clearInterval(this._statusTimerTimeout);
            this._statusTimerTimeout = null;
        }
    }
}
