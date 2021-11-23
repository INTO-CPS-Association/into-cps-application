

/*
 * This file is part of the INTO-CPS toolchain.
 *
 * Copyright (c) 2017-CurrentYear, INTO-CPS Association,
 * c/o Professor Peter Gorm Larsen, Department of Engineering
 * Finlandsgade 22, 8200 Aarhus N.
 *
 * All rights reserved.
 *
 * THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
 * THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
 * ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
 * RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL
 * VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
 *
 * The INTO-CPS toolchain  and the INTO-CPS Association Public License
 * are obtained from the INTO-CPS Association, either from the above address,
 * from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
 * GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of  MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
 * BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
 * THE INTO-CPS ASSOCIATION.
 *
 * See the full INTO-CPS Association Public License conditions for more details.
 *
 * See the CONTRIBUTORS file for author and contributor information.
 */
import { Component, Input, NgZone, OnDestroy } from "@angular/core";
import { CoSimulationConfig } from "../../intocps-configurations/CoSimulationConfig";
/* import { LineChartComponent } from "../shared/line-chart.component"; */
import { CoeSimulationService } from "./coe-simulation.service";
/* import { Http } from "@angular/http"; */

import IntoCpsApp from "../../IntoCpsApp";
import { Message, WarningMessage } from "../../intocps-configurations/Messages";
// needs an alternativ!!
/* import { openCOEServerStatusWindow } from "../../menus"; */
import { shell } from "electron";
import { Subscription } from 'rxjs';

@Component({
  selector: "coe-simulation",
/*   providers: [CoeSimulationService],
  directives: [LineChartComponent], */
  templateUrl: "./angular2-app/coe/coe-simulation.component.html"
})
export class CoeSimulationComponent implements OnDestroy {
  private _path: string;
  private _masterModel: string = "";
  private _resultsDir: string = "";
  private parsing: boolean = false;
  private _coeIsOnlineSub: Subscription;

  @Input()
  external_disable_simulation: boolean = false;

  @Input()
  required_coe_version: number = undefined;

  @Input()
  set resultsdir(resultsDir: string) {
    this._resultsDir = resultsDir;
  }

  get resultsdir(): string {
    return this._resultsDir;
  }

  @Input()
  set mastermodel(masterModel: string) {
    this._masterModel = masterModel;
  }

  get mastermodel(): string {
    return this._masterModel;
  }

  @Input()
  set path(path: string) {
    this._path = path;

    if (path) {
      this.parseConfig();

      if (this.coeSimulation) this.coeSimulation.reset();
    }
  }
  get path(): string {
    return this._path;
  }

  online: boolean = false;
  hasHttpError: boolean = false;
  httpErrorMessage: string = "";
  url: string = "";
  version: string = "";
  config: CoSimulationConfig;
  mmWarnings: WarningMessage[] = [];
  coeWarnings: WarningMessage[] = [];
  simWarnings: WarningMessage[] = [];
  hasPostScriptOutput = false;
  hasPostScriptOutputError = false;
  postScriptOutput = "";
  simulating: boolean = false;
  hasRunSimulation: boolean = false;

  constructor(
    private coeSimulation: CoeSimulationService,
    private zone: NgZone
  ) {
    this._coeIsOnlineSub = coeSimulation.coeIsOnlineObservable.subscribe(isOnline => this.online = isOnline);
  }

  ngOnDestroy() {
    this._coeIsOnlineSub.unsubscribe();
  }

  parseConfig() {
    let project = IntoCpsApp.getInstance().getActiveProject();
    this.parsing = true;

    CoSimulationConfig.parse(
      this.path,
      project.getRootFilePath(),
      project.getFmusPath()
    ).then(config =>
      this.zone.run(() => {
        this.config = config;

        this.mmWarnings = this.config.multiModel.validate();
        this.coeWarnings = this.config.validate();

        this.parsing = false;
      })
    ).catch(error => console.error("error when parsing co-sim-config: " + error));
  }

  canRun() {
    return (
      this.online &&
      this.mmWarnings.length === 0 &&
      this.coeWarnings.length === 0 &&
      !this.parsing &&
      !this.simulating && 
      !this.external_disable_simulation &&
      (this.required_coe_version == undefined ? true : this.required_coe_version == this.coeSimulation.getCoeVersion())
    );
  }

  runSimulation() {
    this.zone.run(() => {
      this.hasHttpError = false;
      this.hasPostScriptOutput = false;
      this.hasPostScriptOutputError = false;
      this.postScriptOutput = "";
      this.simulating = true;
    });

    const errorReportCB = (hasError: boolean, message: string, hasWarning: boolean, stopped: boolean) => {
      this.zone.run(() => {
        this.errorHandler(hasError, message, hasWarning, stopped);
      });
    }
    const simCompletedCB = () => {
      this.zone.run(() => {
        this.hasRunSimulation = true;
        this.simulating = false;
      });
    }
    const postScriptOutputReportCB = (hasError: boolean, message: string) => {
      this.zone.run(() => {
        this.postScriptOutputHandler(hasError, message);
      });
    }

    this.coeSimulation.setSimulationCallBacks(errorReportCB, simCompletedCB, postScriptOutputReportCB);

    if(this._masterModel){
      this.coeSimulation.startSigverSimulation(this.config, this.mastermodel, this._resultsDir);
    } else {
      this.coeSimulation.startSimulation(this.config);
    }
  }

  onOpenResultsFolder() {
    shell.openPath(this.coeSimulation.getResultsDir());
  }

  stopSimulation() {
    this.zone.run(() => {
      this.simulating = false;
    });
    this.coeSimulation.stop();
  }

  errorHandler(hasError: boolean, message: string, hasWarning: boolean = false, stopped?: boolean) {
    if(stopped) {
      var warning = new Message("Co-simulation stopped. COE status OK");
      this.simWarnings.push(warning);
      setTimeout(()=>{
        this.simWarnings.pop();
      }, 5000);
      this.simulating = false;
    } else if(!stopped && hasWarning) {
      var warning = new Message("Unknown error, see the console for more info.");
      this.simWarnings.push(warning);
      console.warn(message);
      setTimeout(()=>{
        this.simWarnings.pop();
        }, 5000);
      this.simulating = false;
    }
    this.hasHttpError = hasError;
    this.httpErrorMessage = message;
    if (hasError) this.simulating = false;
  }

  postScriptOutputHandler(hasError: boolean, message: string) {
    this.hasPostScriptOutput = true;
    this.hasPostScriptOutputError = hasError;
    this.postScriptOutput = message;
  }

  onCoeLaunchClick() {
   this.coeSimulation.
    openCOEServerStatusWindow("autolaunch", false);
  }
}
