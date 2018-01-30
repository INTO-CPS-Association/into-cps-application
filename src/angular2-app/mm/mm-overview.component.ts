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

import { OnInit, Component, Input, NgZone } from "@angular/core";
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import { Serializer } from "../../intocps-configurations/Parser";
import { OutputConnectionsPair } from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";
import { WarningMessage, ErrorMessage } from "../../intocps-configurations/Messages";

@Component({
    selector: "mm-overview",
    templateUrl: "./angular2-app/mm/mm-overview.component.html"
})
export class MmOverviewComponent {
    private _path: string;

    @Input()
    set path(path: string) {
        this._path = path;

        if (path)
            this.parseConfig();
    }
    get path(): string {
        return this._path;
    }

    private config: MultiModelConfig;
    warnings: WarningMessage[] = [];

    constructor(private zone: NgZone) {

    }

    parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(this.path, project.getFmusPath())
            .then(config => this.zone.run(() => { this.config = config; this.warnings = this.config.validate(); }));
    }

    getOutputs() {
        let outputs: OutputConnectionsPair[] = [];

        this.config.fmuInstances.forEach(instance => {
            instance.outputsTo.forEach((connections, scalarVariable) => {
                outputs.push(new OutputConnectionsPair(Serializer.getIdSv(instance, scalarVariable), connections));
            });
        });

        return outputs;
    }

    getWarnings() {
        return this.warnings.filter(w => !(w instanceof ErrorMessage));
    }

    getErrors() {
        return this.warnings.filter(w => w instanceof ErrorMessage);
    }
}
