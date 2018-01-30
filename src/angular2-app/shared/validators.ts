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

import {FormControl, FormArray, FormGroup} from "@angular/forms";

function isString(x:any) {
    return typeof x === 'string';
}

function isNumber(x:any) {
    let number = Number(x);

    return !isNaN(number) && isFinite(number);
}

function isInteger(x:any) {
    let number = Number(x);

    // TODO: It sees 1.0000000000000001 as an integer, due to floating point rounding error.
    return !isNaN(number) && isFinite(number) && number % 1 === 0;
}

export function numberValidator(control: FormControl): { [s: string]: boolean } {
    if (!isNumber(control.value))
        return {invalidNumber: true};
}

export function integerValidator(control: FormControl): { [s: string]: boolean } {
    if (!isInteger(control.value))
        return {invalidInteger: true};
}

export function lengthValidator(min: number = null, max: number = null) {
    return (control: FormControl) => {
        let length = control.value.length;

        if (length === undefined || min !== null && length < min || max !== null && length > max)
            return {invalidLength: true};
    }
}

export function uniqueGroupPropertyValidator(propertyName: string) {
    return (control: FormArray) => {
        for(let i = 0; i < control.length; i++) {
            let group:FormGroup = <FormGroup> control.at(i);
            let value = group.controls[propertyName].value;

            for(let j = i+1; j < control.length; j++) {
                let other:FormGroup = <FormGroup> control.at(j);
                let otherValue = other.controls[propertyName].value;

                if (value === otherValue)
                    return {notUnique: value};
            }
        }
    }
}

export function uniqueValidator(control: FormControl) {
    var elements = control.value;

    for(let i = 0; i < elements.length; i++) {
        for(let j = i+1; j < elements.length; j++) {
            if (elements[i] === elements[j])
                return {notUnique: true};
        }
    }
}

export function uniqueControlValidator(control: FormArray) {
    for(let i = 0; i < control.length; i++) {
        for(let j = i+1; j < control.length; j++) {
            if (control.at(i).value === control.at(j).value)
                return {notUnique: control.at(i).value};
        }
    }
}

export function lessThanValidator(selfName:string, otherName:string) {
    return (group: FormGroup) => {
        let self = group.find(selfName);
        let other = group.find(otherName);

        if (self.value && other.value && Number(self.value) >= Number(other.value)) {
            return {notLessThan:true};
        }
    }
}
