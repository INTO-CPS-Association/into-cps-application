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

import { CoSimulationConfig } from "./CoSimulationConfig"
import * as fs from "fs"
import * as Path from "path";
import { checksum } from "../proj/Project";

export function storeResultCrc(outputPath: string, coeConfig: CoSimulationConfig) {

    let coeCrc = checksum(fs.readFileSync(coeConfig.sourcePath).toString(), "md5", "hex");
    let mmCrc = coeConfig.multiModelCrc;
    let resultCrc = checksum(fs.readFileSync(outputPath).toString(), "md5", "hex");

    let res = { mm_config_crc: mmCrc, coe_config_crc: coeCrc, output_crc: resultCrc }

    let data = JSON.stringify(res);
    let file = Path.join(Path.dirname(outputPath), "result.json");
    console.info(data);

    return new Promise<void>((resolve, reject) => {
        try {

            fs.writeFile(file, data, error => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function isResultValid(outputPath: string): boolean {

    let dir = Path.dirname(outputPath);
    let resultPath = Path.join(dir, "result.json");

    if (!fs.existsSync(resultPath)) {
        return true;//no check
    }

    let data = fs.readFileSync(resultPath, 'utf8');

    let obj = JSON.parse(data);
    //let res = { mm_config_crc: mmCrc, coe_config: coeCrc, result: resultCrc }
    let ok = true;

    let mmCrc = obj["mm_config_crc"];
    if (mmCrc != null) {
        let mmPath = Path.join(dir, "..", "..", "mm.json")
        //console.debug("MM path: " + mmPath);
        let crc = checksum(fs.readFileSync(mmPath).toString(), "md5", "hex");
        //console.debug("crc: " + mmCrc + " == " + crc);
        ok = ok && (crc == mmCrc);
    }
    let coeCrc = obj["coe_config_crc"];
    if (coeCrc != null) {
        
        let coePath = Path.join(dir, "..", "coe.json")
        if(!fs.existsSync(coePath))
        {
                //Backwards compatibility
                let file = fs.readdirSync(Path.join(dir, "..")).find(file => file.endsWith("coe.json"));
                coePath = Path.join(dir,"..",file);
                console.debug("Found old style coe at: " + coePath);
        }
        //console.debug("COE path: " + coePath);
        let crc = checksum(fs.readFileSync(coePath).toString(), "md5", "hex");
        //console.debug("crc: " + coeCrc + " == " + crc);
        ok = ok && (crc == coeCrc);

    }
    let outputCrc = obj["output_crc"];
    if (outputCrc != null) {
        //console.debug("Output path: " + outputPath);
        let crc = checksum(fs.readFileSync(outputPath).toString(), "md5", "hex");
        //console.debug("crc: " + outputCrc + " == " + crc);
        ok = ok && (crc == outputCrc);

    }


    return ok;
}
