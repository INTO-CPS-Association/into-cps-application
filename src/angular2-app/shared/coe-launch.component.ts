import { Component, Input, OnDestroy } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { MaestroApiService, maestroVersions } from "./maestro-api.service";

@Component({
    selector: "coe-launch",
    templateUrl: "./angular2-app/shared/coe-launch.component.html"
  })
export class CoeLaunchComponent implements OnDestroy {
    private _coeIsOnlineSub: Subscription;
    private online: boolean = false;
    private correctCoeVersion: boolean = true;
    private coeVersions = maestroVersions;

    @Input()
    required_coe_version: maestroVersions = undefined;

    @Input()
    coeLaunchClick: Subject<void>;

    constructor(private coeSimulationService: MaestroApiService) {
        this._coeIsOnlineSub = coeSimulationService.startMonitoringOnlineStatus(isOnline => {
            if(this.required_coe_version) {
              this.correctCoeVersion = this.required_coe_version == coeSimulationService.getMaestroVersion();
            }
            this.online = isOnline;
          } );
    }
    ngOnDestroy(): void {
        this.coeSimulationService.stopMonitoringOnlineStatus(this._coeIsOnlineSub);
    }

    private onCoeLaunchClick() {
      if(this.coeLaunchClick) {
        this.coeLaunchClick.next();
      }
      this.coeSimulationService.launchCOE();
    }
}