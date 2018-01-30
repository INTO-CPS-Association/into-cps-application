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


import {IViewController} from "./iViewController";

export class IntoCpsAppMenuHandler {
    openView: (htmlPath: string, callback?: (mainView: HTMLDivElement) => void | IViewController) => void;
    openHTMLInMainView: (path: string, title: string) => void;

    openCoeView: (path: string) => void;
    openMultiModel: (path: string) => void;
    openSysMlDSEExport: (path: string) => void;
    openSysMlExport: (path: string) => void;
    openFmu: (path: string) => void;
    openDseView: (path: string) => void;
    
    deInitialize: () => boolean;
    
    createDse: (path: string) => void;
    createDsePlain: (path: string) => void;
    createSysMLDSEConfig: (path: string) => void;
    createMultiModel: (path: string, titleMsg? : string) => void;
    createCoSimConfiguration: (path: string) => void;

    implodeConfig: (path: string) => void;

    createTDGProject: (path: string) => void;
    createMCProject: (path: string) => void;
    runRTTesterCommand: (commandSpec: any) => void;
    runTest: (path: string) => void;
    openLTLQuery: (path: string) => void;
    openCTAbstractions: (path: string) => void;
    showAddLTLQuery: (folder: string) => void;
    openMCResult: (path: string) => void;

    deletePath: (path: string)=>void;
    openWithSystemEditor: (path: string)=>void;
    createMultiModelPlain: (titleMsg?: string) =>void;
    rename: (path:string)=>void;

    showTraceView: () =>void;
    openTraceability: () =>void;
    exportOvertureFmu: (type: string, path: string)=>void;
}
