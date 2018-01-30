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

import {OnInit, Component, Input, NgZone} from "@angular/core";

import {PanelComponent} from "../shared/panel.component";
import {TrOverviewComponent, subObjectClass} from "./tr-overview.component";

@Component({
    selector: "tr-user",
    directives: [
        PanelComponent,
        TrUserComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrUserComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "User Name";
        this.mainObjectPropertyName2 = "URI";
        this.mainObjectPropertyID1 = "usr.name";
        this.mainObjectPropertyID2 = "usr.uri";
        this.findAllMainObjects = "match (usr{specifier:\"prov:Agent\"}) return usr.name, usr.email, usr.uri";
        
        this.subObjectClasses.push(this.buildSubObjectEntity());
        this.subObjectClasses.push(this.buildSubObjectActiviteis());
        this.updatemainObjects();
    }
    buildSubObjectEntity():subObjectClass{
        let subObj = new subObjectClass;
        subObj.name = "Artefacts";
        subObj.subObjectPropertyName1 = "Type";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.type";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match (usr{uri:'";
        subObj.findAllSubObjectsPart2 = "'})<-[:Trace{name:\"prov:wasAttributedTo\"}]-(entity) return entity.uri, entity.type";
        return subObj;
    }
    buildSubObjectActiviteis():subObjectClass{
        let subObj = new subObjectClass;
        subObj.name = "Activities";
        subObj.subObjectPropertyName1 = "Type";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.type";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match (usr{uri:'";
        subObj.findAllSubObjectsPart2 = "'})<-[:Trace{name:\"prov:wasAssociatedWith\"}]-(entity) return entity.uri, entity.type";
        return subObj;
    }

}
