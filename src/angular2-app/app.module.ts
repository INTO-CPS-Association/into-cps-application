import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { COEModule } from "./coe/coe.module";
import { MmModule } from "./mm/mm.module";
import { FileSystemService } from "./shared/file-system.service";
import { NavigationService } from "./shared/navigation.service";
import { SettingsService } from "./shared/settings.service";
import { SharedModule } from './shared/shared.module';


@NgModule({
  imports: [HttpModule, BrowserModule, FormsModule, MmModule, ReactiveFormsModule,
    COEModule, 
    SharedModule ], // module dependencies
  declarations: [ // components and directives
    AppComponent], 
  bootstrap: [AppComponent], // root component
  providers: [FileSystemService, SettingsService, NavigationService],
  exports: []
})
export class AppModule {

  constructor(){
    console.log("APP MODULE")
  }
}

