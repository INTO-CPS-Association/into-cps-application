import {Component, Input} from "@angular/core";
import { SvConfiguration } from "../../intocps-configurations/sv-configuration";

@Component({
    selector: "sv-coe-interaction",
    templateUrl: "./angular2-app/sv/sv-coe-interaction.component.html"
})
export class SvCoeInteractionComponent{

    @Input()
    svconfiguration: SvConfiguration;
    
    errorClick() {
        let t = this.svconfiguration;
    }
}