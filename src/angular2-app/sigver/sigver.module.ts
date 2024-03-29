import { NgModule } from "@angular/core";
import { CoeConfigurationComponent } from "../coe/coe-configuration.component";
import { CoeSimulationComponent } from "../coe/coe-simulation.component";
import { CoeLaunchComponent } from "../shared/coe-launch.component";
import { SigverCoeInteractionComponent } from "./sigver-coe-interaction.component";
import { SigverConfigurationComponent } from "./sigver-configuration.component";
import { SigverPageComponent } from "./sigver-page.component";

@NgModule({
	declarations: [SigverPageComponent, SigverConfigurationComponent, SigverCoeInteractionComponent],
	imports: [CoeConfigurationComponent, CoeSimulationComponent, CoeLaunchComponent],
	exports: [SigverPageComponent],
})
export class SIGVERModule {
	constructor() {
		console.log("SIGVER MODULE");
	}
}
