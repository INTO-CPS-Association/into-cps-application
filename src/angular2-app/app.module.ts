import { NgModule, NgZone } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { FormsModule } from "@angular/forms";
import { Http } from "@angular/http";
import {FileSystemService} from "./shared/file-system.service";
import {SettingsService} from "./shared/settings.service";
import {NavigationService} from "./shared/navigation.service";
import {MmPageComponent} from "./mm/mm-page.component";
//import {TrPageComponent} from "./tr/tr-page.component";
import {DsePageComponent} from "./dse/dse-page.component";
import {CoePageComponent} from "./coe/coe-page.component";
import {MmConfigurationComponent} from "./mm/mm-configuration.component";
import {MmOverviewComponent} from "./mm/mm-overview.component";
import {PanelComponent} from "./shared/panel.component";
import {MmModule} from "./mm/mm.module"
import {HttpModule} from '@angular/http';
@NgModule({
  imports: [HttpModule, BrowserModule, FormsModule, MmModule ], // module dependencies
  declarations: [AppComponent], // components and directives
  bootstrap: [AppComponent], // root component
  providers: [FileSystemService, SettingsService, NavigationService], // services
})
export class AppModule {

  constructor(){
    console.log("MODULE")
  }
}

