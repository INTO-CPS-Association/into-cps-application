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

import * as Path from 'path';
import { CoSimulationConfig } from "../../../intocps-configurations/CoSimulationConfig";
import { Instance, ScalarVariable } from "../models/Fmu"
import { Serializer } from "../../../intocps-configurations/Parser"

export class CoeConfig {
    constructor(private coSimConfig: CoSimulationConfig, private remoteCoe: boolean = false) {

    }

    toJSON(implodeMM?: any): string {
        let fmus: any = {};
        this.coSimConfig.multiModel.fmus.forEach(fmu => {
            let fmuPath;
            if(this.remoteCoe) fmuPath = Path.join("session:", Path.basename(fmu.path));
            else if (fmu.isNested())
            {
                fmuPath = "coe:/" + fmu.path;
            }
            else
            {
                fmuPath = "file:///" + fmu.path
            }
            fmus[fmu.name] = fmuPath.replace(/\\/g, "/").replace(/ /g, "%20");
        });
        // Add the implode fmu
        if (implodeMM) {
            for (let key in implodeMM.fmus) {
                fmus[key] = implodeMM.fmus[key];
            }
        }

        let data: any = {};

        let livestream: Map<string, ScalarVariable[]> = new Map<string, ScalarVariable[]>();

        if (this.coSimConfig.liveGraphs) {
            this.coSimConfig.liveGraphs.forEach(g => {

                if (g.getLivestream()) {
                    g.getLivestream().forEach((svs, ins: Instance) => {

                        let iname = Serializer.getId(ins);
                        if (livestream.has(iname)) {
                            let list: any = livestream.get(iname);
                            g.getLivestream().get(ins).forEach(sv => {
                                if (list.indexOf(sv) < 0) {
                                    list.push(sv);
                                }
                            });

                            livestream.set(iname, list);
                        }
                        else {
                            livestream.set(iname, g.getLivestream().get(ins).map(x => x));
                        }
                    });
                }

            });
        }

        //FMUS
        Object.assign(data, this.coSimConfig.multiModel.toObject(), this.coSimConfig.toObject());
        
        if (implodeMM) {
            for (let key in implodeMM.connections) {
                data.connections[key] = implodeMM.connections[key];
            }
            if(implodeMM.logVariables)
             data["logVariables"] = implodeMM.logVariables;

             data["hasExternalSignals"] = true;
        }

        delete data["endTime"];
        delete data["startTime"];
        delete data["multimodel_path"];
        delete data["multimodel_crc"];
        delete data["enableAllLogCategoriesPerInstance"];
        delete data["postProcessingScript"];

        let livestreamData: any = {};
        livestream.forEach((svs, iname) => livestreamData[iname] = svs.map(sv => sv.name));
        data["livestream"] = livestreamData;

        if (data["graphs"])
            delete data["graphs"];



        if (!data["livestreamInterval"])
            delete data["livestreamInterval"];
        if (!data["visible"])
            delete data["visible"];
        if (!data["loggingOn"])
            delete data["loggingOn"];

        if (data["overrideLogLevel"] === null || data["overrideLogLevel"] === "Not set")
            delete data["overrideLogLevel"];

        data["fmus"] = fmus;

        return JSON.stringify(data);
    }
}





