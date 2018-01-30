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

import {Component, Input, Output, EventEmitter, OnInit} from "@angular/core";
import {remote} from "electron";
import * as Path from "path";
import * as fs from "fs";

@Component({
    selector: "file-browser",
    templateUrl: "./angular2-app/mm/inputs/file-browser.component.html"
})
export class FileBrowserComponent implements OnInit {
    @Input()
    basePath = "";

    @Input()
    set path(path:string) {
        this._path = path.replace(Path.normalize(`${this.basePath}/`), "");
    }
    get path():string {
        return this._path;
    }

    @Output()
    pathChange = new EventEmitter<string>();

    private _path:string = "";
    private dialog:Electron.Dialog;
    private platform:string;

    ngOnInit():any {
        this.dialog = remote.dialog;
        this.platform = remote.getGlobal("intoCpsApp").platform;
    }

    browseFile() {
        this.browse(["openFile"]);
    }

    browseDirectory() {
        this.browse(["openDirectory"]);
    }

    browse(properties: ('openFile' | 'openDirectory' | 'multiSelections' | 'createDirectory')[] = ["openFile", "openDirectory"]) {
        let dialogResult: string[] = this.dialog.showOpenDialog({defaultPath: this.basePath,  properties: properties });

        if (dialogResult) this.onChange(dialogResult[0]);
    }

    onChange(path:string) {
        this.path = path;

        fs.access(Path.normalize(`${this.basePath}/${this.path}`), fs.constants.R_OK, error => {
            this.pathChange.emit(Path.normalize(error ? this.path : `${this.basePath}/${this.path}`));
        });
    }
}
