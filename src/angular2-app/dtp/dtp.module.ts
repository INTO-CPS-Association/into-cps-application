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
import {NgModule} from "@angular/core";
import { DtpPageComponent } from "./dtp-page.component";
import { DtpConfigurationComponent } from "./dtp-configuration.component";
import { DtpMaestroComponent } from "./inputs/maestro.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { CommonModule } from "@angular/common";
import { DtpServerComponent } from "./inputs/server.component";
import {DtpSignalComponent} from "./inputs/signal.component";
import { DtpDataRepeaterComponent } from "./inputs/datarepeater.component";
import { DtpToolComponent } from "./inputs/tool.component";
import { DtpTaskConfigurationComponent } from "./inputs/taskConfiguration.component";
import { MmModule } from "../mm/mm.module";
@NgModule({
    imports: [ FormsModule, ReactiveFormsModule, SharedModule, CommonModule , MmModule], // module dependencies
    declarations: [ DtpPageComponent, DtpConfigurationComponent, DtpMaestroComponent, DtpServerComponent, DtpSignalComponent, DtpDataRepeaterComponent, DtpToolComponent, DtpTaskConfigurationComponent], // components and directives
    exports: [DtpPageComponent]
  })
  export class DtpModule {

    constructor(){
      console.log("DTP-MODULE")
    }
  }
