import {NgModule} from "@angular/core";
import {MmPageComponent} from "./mm-page.component";
import {MmConfigurationComponent} from "./mm-configuration.component";
import {MmOverviewComponent} from "./mm-overview.component";
import {PanelComponent} from "../shared/panel.component";
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {FileBrowserComponent} from "./inputs/file-browser.component"
@NgModule({
    imports: [ BrowserModule, FormsModule, ReactiveFormsModule], // module dependencies
    declarations: [ MmPageComponent, PanelComponent,
      MmConfigurationComponent,
      MmOverviewComponent,
      FileBrowserComponent], // components and directives
    exports: [MmPageComponent]
  })
  export class MmModule {
  
    constructor(){
      console.log("MODULE")
    }
  }
  