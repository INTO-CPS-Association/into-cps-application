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

import {Component, Input} from "@angular/core";
import {FormGroup, FormArray, FormControl, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES} from "@angular/forms";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {InstanceScalarPair} from "../models/Fmu";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./angular2-app/coe/inputs/bounded-difference.component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    ports:Array<InstanceScalarPair> = [];

    @Input()
    formGroup:FormGroup;

    @Input()
    editing:boolean = false;

    customTrackBy(index:number, obj: any):any {
        return index;
    }

    addPort() {
        this.constraint.ports.push(this.ports[0]);
        this.updatePortValidation();
    }

    removePort(port:InstanceScalarPair) {
        this.constraint.ports.splice(this.constraint.ports.indexOf(port), 1);
        this.updatePortValidation();
    }

    onPortChange(output: InstanceScalarPair, index: number) {
        this.constraint.ports[index] = output;
        this.updatePortValidation();
    }

    updatePortValidation() {
        let formControl = <FormControl> this.formGroup.find('ports');
        formControl.updateValueAndValidity();
    }
}
