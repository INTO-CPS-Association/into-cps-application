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


import fs = require("fs");

export class SignalMapEntry {
    lowerBound: number;
    upperBound: number;
    sutWritesToTE: boolean;
    teWritesToSUT: boolean;
    teReadConcreteSignalIdentifier: string;
    teReadSwitchVariable: string;
    teReadswitchValue: string;
    teWriteConcreteSignalIdentifier: string;
    teWriteSwitchVariable: string;
    teWriteSwitchValue: string;
    admissibleError: number;
    latency: number;
}

export class SignalMap {
    header: string = "";
    entries: { [variable: string]: SignalMapEntry } = {};
    constructor() { }
    static loadFromFile(fileName: string, callback: (map: SignalMap) => void) {
        let map = new SignalMap();
        let self = this;
        let isFirstLine = true;
        var lineReader = require("readline").createInterface({
            input: require("fs").createReadStream(fileName)
        });
        lineReader.on("line", (line: string) => {
            if (isFirstLine) {
                isFirstLine = false;
                map.header = line;
            } else {
                let cells = line.split(";");
                let e = new SignalMapEntry();
                map.entries[cells[0]] = e;
                e.lowerBound = +cells[1];
                e.upperBound = +cells[2];
                e.sutWritesToTE = cells[3] == "1";
                e.teWritesToSUT = cells[4] == "1";
                e.teReadConcreteSignalIdentifier = cells[5];
                e.teReadSwitchVariable = cells[6];
                e.teReadswitchValue = cells[7];
                e.teWriteConcreteSignalIdentifier = cells[8];
                e.teWriteSwitchVariable = cells[9];
                e.teWriteSwitchValue = cells[10];
                e.admissibleError = +cells[11];
                e.latency = +cells[12];
            }
        });
        lineReader.on("close", () => { callback(map); });
    }
    saveToFile(fileName: string, callback: (error: any) => void) {
        let s = "";
        s += this.header + "\n";
        for (let v in this.entries) {
            s += v;
            s += ";" + this.entries[v].lowerBound;
            s += ";" + this.entries[v].upperBound;
            s += ";" + (this.entries[v].sutWritesToTE ? 1 : 0);
            s += ";" + (this.entries[v].teWritesToSUT ? 1 : 0);
            s += ";" + this.entries[v].teReadConcreteSignalIdentifier;
            s += ";" + this.entries[v].teReadSwitchVariable;
            s += ";" + this.entries[v].teReadswitchValue;
            s += ";" + this.entries[v].teWriteConcreteSignalIdentifier;
            s += ";" + this.entries[v].teWriteSwitchVariable;
            s += ";" + this.entries[v].teWriteSwitchValue;
            s += ";" + this.entries[v].admissibleError;
            s += ";" + this.entries[v].latency;
            s += ";\n";
        }
        fs.writeFile(fileName, s, callback);
    }
}
