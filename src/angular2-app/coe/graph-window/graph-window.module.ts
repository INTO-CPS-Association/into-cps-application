import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
/* import { HttpModule } from '@angular/http'; */
import { HttpClientModule } from '@angular/common/http';
import { LineChartComponent } from '../../shared/line-chart.component';
import { FileSystemService } from '../../shared/file-system.service';

@NgModule({
  declarations: [
    AppComponent,
    LineChartComponent
  ],
  imports: [
    BrowserModule, 
    /* HttpModule */
    HttpClientModule
  ],
  providers: [FileSystemService],
  bootstrap: [AppComponent]
})
export class GraphWindowModule { 

    constructor()
    {console.log("GraphWindowModule");}
}