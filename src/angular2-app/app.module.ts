import { NgModule, NgZone } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { FormsModule } from "@angular/forms";
/* import { Http } from "@angular/http"; */
import {FileSystemService} from "./shared/file-system.service";
import {SettingsService} from "./shared/settings.service";
import {NavigationService} from "./shared/navigation.service";
/* import {MmPageComponent} from "./mm/mm-page.component"; */
/* import {TrPageComponent} from "./tr/tr-page.component"; */
/* import {DsePageComponent} from "./dse/dse-page.component";
import {CoePageComponent} from "./coe/coe-page.component";
import {MmConfigurationComponent} from "./mm/mm-configuration.component";
import {MmOverviewComponent} from "./mm/mm-overview.component";
import {PanelComponent} from "./shared/panel.component"; */
import {MmModule} from "./mm/mm.module"
import {COEModule} from "./coe/coe.module"
import {HttpModule} from '@angular/http';
import { SharedModule } from './shared/shared.module';

@NgModule({
  imports: [HttpModule, BrowserModule, FormsModule, MmModule, COEModule, SharedModule ], // module dependencies
  declarations: [AppComponent/* , MmPageComponent, CoePageComponent, DsePageComponent, TrPageComponent */], // components and directives
  bootstrap: [AppComponent], // root component
  providers: [FileSystemService, SettingsService, NavigationService], // services
  exports: []
})
export class AppModule {}
