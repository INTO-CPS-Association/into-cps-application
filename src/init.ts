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
'use strict'

class InitializationController {
    mainViewId: string = "mainView";
    layout!: W2UI.W2Layout;
    title!: HTMLTitleElement;
    mainView!: HTMLDivElement;

    constructor() {
        this.initialize();
    }
    private initialize() {
        this.setTitle();
        this.configureLayout();
        this.loadViews();
        console.log("InitializationController initialized");
    }
    
    private configureLayout() {
        let layout: HTMLDivElement = <HTMLDivElement>document.querySelector("#layout");
        let pstyle = "border: 1px solid #dfdfdf; padding: 5px; background-color: #FFFFFF";
        this.layout = $(layout).w2layout({
            name: "layout",
            padding: 4,
            panels: [
                { type: "left", size: 200, resizable: true, style: pstyle },
                { type: "main", style: pstyle },
                { type: 'preview', size: '50%', resizable: true, style: pstyle, content: 'preview' },
                { type: 'bottom', size: 50, resizable: false, style: pstyle, content: 'bottom' }
            ]
        });
    }
    private setTitle() {
        this.title = <HTMLTitleElement>document.querySelector("INTO-CPS Application");
    }

    private loadViews() {
        this.layout.load("main", "main.html", "", () => {
            this.mainView = (<HTMLDivElement>document.getElementById(this.mainViewId));
            var appVer = (<HTMLSpanElement>document.getElementById('appVersion'));
            appVer.innerText = "5.0.0";
        });
        this.layout.load("bottom", "bottom.html", "", () => {});
        this.layout.hide("preview");
    }
}

// Initialise controllers
let init = new InitializationController();

export default InitializationController 