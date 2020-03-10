import {NgModule} from "@angular/core";
import {MmPageComponent} from "./mm-page.component";
import {MmConfigurationComponent} from "./mm-configuration.component";
import {MmOverviewComponent} from "./mm-overview.component";
import {PanelComponent} from "../shared/panel.component";
import { SharedModule } from "../shared/shared.module";
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {FileBrowserComponent} from "./inputs/file-browser.component"
@NgModule({
    imports: [ BrowserModule, FormsModule, ReactiveFormsModule, SharedModule], // module dependencies
    declarations: [ MmPageComponent, 
      MmConfigurationComponent,
      MmOverviewComponent], // components and directives
    exports: [MmPageComponent]
  })
  export class MmModule {

    constructor(){
      console.log("MM-MODULE")
    }
  }
