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
    exports: [CoePageComponent],
    providers: [CoeSimulationService]
})
export class COEModule {

    constructor() {
        console.log("COE MODULE")
    }
}
