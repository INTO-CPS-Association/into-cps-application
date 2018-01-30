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
    selector: "tr-sim",
    directives: [
        PanelComponent,
        TrResultComponent],
    templateUrl: "./angular2-app/tr/tr-overview.component.html"
})


export class TrResultComponent extends TrOverviewComponent{
    constructor(zone:NgZone) {
        super(zone);
        this.mainObjectPropertyName1 = "Simulation Time";
        this.mainObjectPropertyName2 = "Result URI";
        this.mainObjectPropertyID1 = "m.time";
        this.mainObjectPropertyID2 = "n.uri";
        this.findAllMainObjects = "match (n{type:\"simulationResult\"})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(m) return n.uri, m.time, m.type";

        this.subObjectClasses.push(this.buildSubObjectFile());
        this.updatemainObjects();
    }
    buildSubObjectFile():subObjectClass{
        let subObj = new subObjectClass();
        subObj.name = "Used Files";
        subObj.subObjectPropertyName1 = "Used File";
        subObj.subObjectPropertyName2 = "URI";
        subObj.subObjectPropertyID1 = "entity.path";
        subObj.subObjectPropertyID2 = "entity.uri";
        subObj.findAllSubObjectsPart1 = "match({uri:'";
        subObj.findAllSubObjectsPart2 = "'})-[:Trace{name:\"prov:wasGeneratedBy\"}]->(simulation)-[:Trace{name:\"prov:used\"}]-(entity) return entity.uri, entity.path, entity.hash";
        return subObj;
    }
}
