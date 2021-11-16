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
import { NgModule } from "@angular/core";
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CoePageComponent } from "./coe-page.component";
import { CoeSimulationService } from "./coe-simulation.service";
import { SharedModule } from "../shared/shared.module";
import { CoeConfigurationComponent } from "./coe-configuration.component";
import { ZeroCrossingComponent } from "./inputs/zero-crossing.component";
import { FmuMaxStepSizeComponent } from "./inputs/fmu-max-step-size.component";
import { BoundedDifferenceComponent } from "./inputs/bounded-difference.component";
import { SamplingRateComponent } from "./inputs/sampling-rate.component";
import { LiveGraphComponent } from "./inputs/live-graph-component";
import { CoeSimulationComponent } from "./coe-simulation.component";
import { LineChartComponent } from "../shared/line-chart.component";
@NgModule({
    imports: [BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule], // Brings PanelComponent and FileBrowserComponent
    declarations: [CoePageComponent,
        CoeConfigurationComponent,
        ZeroCrossingComponent,
        FmuMaxStepSizeComponent,
        BoundedDifferenceComponent,
        SamplingRateComponent,
        LiveGraphComponent,
        CoeSimulationComponent,
        LineChartComponent],
    exports: [CoePageComponent, CoeSimulationComponent],
    providers: [CoeSimulationService]
})
export class COEModule {

    constructor() {
        console.log("COE MODULE")
    }
}