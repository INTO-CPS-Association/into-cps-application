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

export class RangeBasedAbstraction {
    lowerBound: Number;
    upperBound: Number;
    constructor() {
        this.lowerBound = this.upperBound = 0;
    }
}

export class GradientBasedAbstraction {
    gradient: Number;
    timeFrame: Number;
    constructor() {
        this.gradient = 0;
        this.timeFrame = 1000;
    }
}

export class SimulationBasedAbstraction {
    fileName: string;
    maxValueRange: Number;
    constructor() {
        this.fileName = null;
        this.maxValueRange = 1;
    }
}

export class Abstraction {
    selected: string;
    rangeBased: RangeBasedAbstraction;
    gradientBased: GradientBasedAbstraction;
    simulationBased: SimulationBasedAbstraction;
    constructor() {
        this.selected = "none";
        this.rangeBased = new RangeBasedAbstraction();
        this.gradientBased = new GradientBasedAbstraction();
        this.rangeBased = new RangeBasedAbstraction();
        this.simulationBased = new SimulationBasedAbstraction();
    }
}

export class Input {
    name: string;
    type: string;
    abstraction: Abstraction;
    constructor() {
        this.abstraction = new Abstraction();
    }
}

export interface Interface {
    name: string;
    inputs: Input[];
}

export interface Component {
    name: string;
    inputInterfaces: Interface[];
}

export class Abstractions {
    components: Component[];
    static loadFromJSON(fileName: string): Abstractions {
        let str = fs.readFileSync(fileName).toString();
        return JSON.parse(str);
    }
    static writeToJSON(a: Abstractions, fileName: string) {
        fs.writeFileSync(fileName, JSON.stringify(a, null, 4), { encoding: "utf8" });
    }
}
