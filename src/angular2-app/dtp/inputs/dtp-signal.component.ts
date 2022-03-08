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

import { Component, Input } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { SignalDtpType } from "../dtp-configuration";

@Component({
    selector: "dtp-signal",
    templateUrl: "./angular2-app/dtp/inputs/dtp-signal.component.html",
})
export class DtpSignalComponent {
    @Input()
    signal: SignalDtpType;

    @Input()
    formGroup: FormGroup;

    @Input()
    editing: boolean = true;

    @Input()
    signaltypes: string[] = [];

    constructor() {}

    onChangeName(name: string) {
        this.signal.name = name;
    }

    onChangeSourceExchange(exchange: string) {
        this.signal.source.exchange = exchange;
    }

    onChangeSourceDataType(dataType: string) {
        this.signal.source.datatype = dataType;
    }

    onChangeSourceRoutingKey(routingKey: string) {
        this.signal.source.routing_key = routingKey;
    }

    onChangeTargetExchange(exchange: string) {
        this.signal.target.exchange = exchange;
    }

    onChangeTargetDataType(dataType: string) {
        this.signal.target.datatype = dataType;
    }

    onChangeTargetRoutingKey(routingKey: string) {
        this.signal.target.routing_key = routingKey;
    }

    onChangeTargetPack(pack: string) {
        this.signal.target.pack = pack;
    }

    onChangeTargetPath(path: string) {
        this.signal.target.path = path;
    }
}