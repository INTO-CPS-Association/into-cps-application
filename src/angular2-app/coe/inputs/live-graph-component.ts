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

import { Component, Input } from "@angular/core";
import { FormArray, FormControl, FormGroup, FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES } from "@angular/forms";
import { LiveGraph, CoSimulationConfig } from "../../../intocps-configurations/CoSimulationConfig";
import { ScalarVariable, CausalityType, Instance, InstanceScalarPair, ScalarVariableType } from "../models/Fmu";

@Component({
    selector: 'live-graph',
    templateUrl: "./angular2-app/coe/inputs/live-graph-component.html",
    directives: [FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES]
})
export class LiveGraphComponent {
    @Input()
    graph: LiveGraph;

    @Input()
    config: CoSimulationConfig;
   /* set path(config: CoSimulationConfig) {
        this.config = config;

        if (config)
            this.parseconfig();
    }
    get path(): CoSimulationConfig {
        return this.config;
    }*/


    @Input()
    formGroup: FormGroup;


    @Input()
    editing: boolean = false;

    
    outputPorts: Array<InstanceScalarPair> = [];

   /* parseconfig() {
        // Create an array of all output ports on all instances
        this.outputPorts = this.config.multiModel.fmuInstances
            .map(instance => instance.fmu.scalarVariables
                .filter(sv => sv.type === ScalarVariableType.Real && (sv.causality === CausalityType.Output || sv.causality === CausalityType.Parameter))
                .map(sv => this.config.multiModel.getInstanceScalarPair(instance.fmu.name, instance.name, sv.name)))
            .reduce((a, b) => a.concat(...b), []);
    }
*/
    liveStreamSearchName: string = '';

    customTrackBy(index: number, obj: any): any {
        return index;
    }

    getOutputs(scalarVariables: Array<ScalarVariable>) {
        return scalarVariables.filter(variable => (variable.causality === CausalityType.Output || variable.causality === CausalityType.Local));
    }

    isLocal(variable: ScalarVariable): boolean {
        return variable.causality === CausalityType.Local
    }

    getScalarVariableTypeName(type: ScalarVariableType) {
        return ScalarVariableType[type];
    }

    restrictToCheckedLiveStream(instance: Instance, scalarVariables: Array<ScalarVariable>) {
        return scalarVariables.filter(variable => this.isLivestreamChecked(instance, variable));
    }

    isLivestreamChecked(instance: Instance, output: ScalarVariable) {
        let variables = this.graph.getLivestream().get(instance);

        if (!variables) return false;

        return variables.indexOf(output) !== -1;
    }

    onLivestreamChange(enabled: boolean, instance: Instance, output: ScalarVariable) {
        let variables = this.graph.getLivestream().get(instance);

        if (!variables) {
            variables = [];
            this.graph.getLivestream().set(instance, variables);
        }

        if (enabled)
            variables.push(output);
        else {
            variables.splice(variables.indexOf(output), 1);

            if (variables.length == 0)
                this.graph.getLivestream().delete(instance);
        }
    }

    onLiveStreamKey(event: any) {
        this.liveStreamSearchName = event.target.value;
    }
}
