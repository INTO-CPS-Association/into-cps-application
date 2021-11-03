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

import { Component, Input, AfterContentInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { DTPConfig, ToolDtpItem, ToolTypes } from "../../../intocps-configurations/dtp-configuration";

@Component({
    selector: 'tool',
    templateUrl: "./angular2-app/dtp/inputs/tool.component.html"
})
export class DtpToolComponent implements AfterContentInit{
    @Input()
    tool: ToolDtpItem

    @Input()
    formGroup:FormGroup;
    
    @Input()
    editing: boolean = true;

    toolTypes = ToolTypes

    keys: string[];

    constructor() {
        console.log("Tool component constructor");
        this.keys = Object.keys(this.toolTypes);
    }

    ngAfterContentInit(): void {
        this.editing = this.tool.name == "";
    }

    setPath(path: string) {
        this.tool.path = path;
        this.formGroup.patchValue({path: path});
        let formControl = <FormControl> this.formGroup.get('path');
        formControl.updateValueAndValidity();
    }
}