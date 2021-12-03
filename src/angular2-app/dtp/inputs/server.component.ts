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
import { FormGroup } from "@angular/forms";
import { DTPConfig, ServerDtpItem } from "../dtp-configuration";
import { DtpDtToolingService } from "../dtp-dt-tooling.service";

@Component({
    selector: 'server',
    templateUrl: "./angular2-app/dtp/inputs/server.component.html"
})
export class DtpServerComponent implements AfterContentInit {
    private _editing: boolean = true;
    @Input()
    server: ServerDtpItem

    @Input()
    formGroup:FormGroup;
    set editing(editing: boolean) {
        this._editing = editing;
    }
    get editing(): boolean {
        return this._editing;
    }

    @Input()
    config: DTPConfig;

    @Input()
    servertypes: string[];

    constructor(private dtpToolingService: DtpDtToolingService) {
        console.log("Server component constructor");
    }

    ngAfterContentInit(): void {
        this.editing = !this.server.isCreatedOnServer;
    }

    onChangeName(name: string) {
        this.server.name = name;
    }

    onChangeUsername(username: string) {
        this.server.username = username;
    }

    onChangePassword(password: string) {
        this.server.password = password;
    }

    onChangeHost(host: string) {
        this.server.host = host;
    }

    onChangePort(port: string) {
        this.server.port = +port;
    }

    onChangeEmbedded(embedded: boolean) {
        this.server.embedded = embedded;
    }

    onSaveServer() {       
        this.dtpToolingService.updateServer(this.server.id, this.server.toYamlObject(), this.config.projectName).then(() => {
            this.editing = false;
            this.server.isCreatedOnServer = true;
        });
    }
}

