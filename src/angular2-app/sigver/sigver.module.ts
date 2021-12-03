import { NgModule } from "@angular/core";
import { CoeSimulationComponent } from "../coe/coe-simulation.component";
import { SigverCoeInteractionComponent } from "./sigver-coe-interaction.component";
import { SigverConfigurationComponent } from "./sigver-configuration.component";
import { SigverPageComponent } from "./sigver-page.component";

@NgModule({
    declarations: [
        SigverPageComponent,
        SigverConfigurationComponent,
        SigverCoeInteractionComponent
    ],
    imports: [CoeSimulationComponent],
    exports: [SigverPageComponent]
})
export class SIGVERModule {

    constructor() {
        console.log("SIGVER MODULE")
    }
}