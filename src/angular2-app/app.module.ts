/*
 * This file is part of the INTO-CPS toolchain.
 *
 * Copyright (c) 2017-CurrentYear, INTO-CPS Association,
 * c/o Professor Peter Gorm Larsen, Department of Engineering
 * Finlandsgade 22, 8200 Aarhus N.
 *
 * All rights reserved.
 *
 * THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
 * THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
 * ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
 * RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL 
 * VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
 *
 * The INTO-CPS toolchain  and the INTO-CPS Association Public License 
 * are obtained from the INTO-CPS Association, either from the above address,
 * from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
 * GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of  MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
 * BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
 * THE INTO-CPS ASSOCIATION.
 *
 * See the full INTO-CPS Association Public License conditions for more details.
 *
 * See the CONTRIBUTORS file for author and contributor information. 
 */
import { NgModule, NgZone } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppComponent } from './app.component'
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
/* import { Http } from "@angular/http"; */
import {FileSystemService} from "./shared/file-system.service";
import {SettingsService} from "./shared/settings.service";
import {NavigationService} from "./shared/navigation.service";
/* import {MmPageComponent} from "./mm/mm-page.component"; */


/*import {CoePageComponent} from "./coe/coe-page.component";
import {MmConfigurationComponent} from "./mm/mm-configuration.component";
import {MmOverviewComponent} from "./mm/mm-overview.component";
import {PanelComponent} from "./shared/panel.component"; */
import { DseConfigurationComponent } from './dse/dse-configuration.component';
import {DsePageComponent} from "./dse/dse-page.component";
import {MmModule} from "./mm/mm.module"
import {COEModule} from "./coe/coe.module"
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { DseCoeLaunchComponent, SafePipe } from './dse/dse-coe-launch.component';
import {SigverPageComponent} from "./sigver/sigver-page.component";
import {SigverConfigurationComponent} from "./sigver/sigver-configuration.component";
import {SigverCoeInteractionComponent} from "./sigver/sigver-coe-interaction.component";
import { DtpModule } from './dtp/dtp.module';

@NgModule({
  imports: [ BrowserModule, HttpClientModule, FormsModule,
     MmModule, COEModule, ReactiveFormsModule, SharedModule, DtpModule], // module dependencies
  declarations: [AppComponent , SafePipe,  DsePageComponent, DseConfigurationComponent, DseCoeLaunchComponent, SigverPageComponent, SigverConfigurationComponent, SigverCoeInteractionComponent], // components and directives
  bootstrap: [AppComponent], // root component
  providers: [FileSystemService, SettingsService, NavigationService], // services
  exports: []
})
export class AppModule {}
