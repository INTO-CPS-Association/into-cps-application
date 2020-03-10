import { NgModule } from '@angular/core'
import {PanelComponent} from "./panel.component"
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileBrowserComponent } from '../mm/inputs/file-browser.component';
@NgModule({
    imports: [FormsModule, CommonModule],
    declarations: [ // components and directives
      PanelComponent, 
      FileBrowserComponent],
    exports: [PanelComponent, FileBrowserComponent]
  })
  export class SharedModule {

    constructor(){
      console.log("Shared MODULE")
    }
  }