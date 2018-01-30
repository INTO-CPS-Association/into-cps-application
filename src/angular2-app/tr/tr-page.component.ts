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

import {Component} from "@angular/core"; // , Input
import {TrResultComponent} from "./tr-result.component";
import {TrUserComponent} from "./tr-user.component";
import {TrFUMsComponent} from "./tr-fmus.component";
import {ReqNoResultComponent} from "./tr-reqnores.component";
import {ReqNoPosResultComponent} from "./tr-reqnopos.component";
import {ReqOneResultComponent} from "./tr-reqoneres.component";
import IntoCpsApp from "../../IntoCpsApp";
import {PanelComponent} from "../shared/panel.component";

@Component({
    selector: "tr-page",
    directives: [
        PanelComponent,
        TrResultComponent,
        TrFUMsComponent,
        TrUserComponent,
        ReqNoResultComponent,
        ReqNoPosResultComponent,
        ReqOneResultComponent
        
//        MmOverviewComponent
    ],
    templateUrl: "./angular2-app/tr/tr-page.component.html",
})
export class TrPageComponent {
//    @Input()
//    path:string;
}
