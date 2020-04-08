import { BrowserModule } from "@angular/platform-browser";
import { TrPageComponent } from "./tr-page.component";
import { TrResultComponent } from "./tr-result.component";
import { TrFUMsComponent } from "./tr-fmus.component";
import { ReqNoPosResultComponent } from "./tr-reqnopos.component";
import { ReqNoResultComponent } from "./tr-reqnores.component";
import { ReqOneResultComponent } from "./tr-reqoneres.component";
import { SharedModule } from "../shared/shared.module";
import { NgModule } from "@angular/core";
import { TrUserComponent } from "./tr-user.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@NgModule({
    imports: [ BrowserModule, SharedModule, FormsModule, ReactiveFormsModule], // module dependencies
    declarations: [TrPageComponent, 
        TrResultComponent, 
        TrFUMsComponent, 
        TrUserComponent,
        ReqNoResultComponent,
        ReqNoPosResultComponent,
        ReqOneResultComponent], // components and directives
    exports: [TrPageComponent]
  })
  export class TrModule {

    constructor(){
      console.log("MM MODULE")
    }
  } 