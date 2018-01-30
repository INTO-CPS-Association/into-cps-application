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

import { Component, Input, EventEmitter, Output, NgZone } from "@angular/core";
import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import IntoCpsApp from "../../IntoCpsApp";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm,
    VariableStepAlgorithm, ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint,
    VariableStepConstraint, FmuMaxStepSizeConstraint, LiveGraph
} from "../../intocps-configurations/CoSimulationConfig";
import { ScalarVariable, CausalityType, Instance, InstanceScalarPair, ScalarVariableType } from "./models/Fmu";
import { LiveGraphComponent } from "./inputs/live-graph-component";
import { ZeroCrossingComponent } from "./inputs/zero-crossing.component";
import { BoundedDifferenceComponent } from "./inputs/bounded-difference.component";
import { FmuMaxStepSizeComponent } from "./inputs/fmu-max-step-size.component";
import { SamplingRateComponent } from "./inputs/sampling-rate.component";
import { numberValidator, lessThanValidator ,uniqueGroupPropertyValidator} from "../shared/validators";
import { NavigationService } from "../shared/navigation.service";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { FileBrowserComponent } from "../mm/inputs/file-browser.component";

@Component({
    selector: "coe-configuration",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        ZeroCrossingComponent,
        FmuMaxStepSizeComponent,
        BoundedDifferenceComponent,
        SamplingRateComponent,
        FileBrowserComponent,
        LiveGraphComponent
    ],
    templateUrl: "./angular2-app/coe/coe-configuration.component.html"
})
export class CoeConfigurationComponent {
    private _path: string;

    public Fmu_x = require("./models/Fmu");


    @Input()
    set path(path: string) {
        this._path = path;

        if (path)
            this.parseConfig();
    }
    get path(): string {
        return this._path;
    }

    @Output()
    change = new EventEmitter<string>();

    form: FormGroup;
    algorithms: ICoSimAlgorithm[] = [];
    algorithmFormGroups = new Map<ICoSimAlgorithm, FormGroup>();
    outputPorts: Array<InstanceScalarPair> = [];
    newConstraint: new (...args: any[]) => VariableStepConstraint;
    editing: boolean = false;
    
    logVariablesSearchName: string = '';
    parseError: string = null;
    warnings: WarningMessage[] = [];
    loglevels: string[] = ["Not set", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

    // liveGraphs: LiveGraph[];
    //The variable zeroCrossings is necessary to give different names to the radiobutton groups in the different zeroCrossing constraints.
    // Otherwise they will all be connected.
    zeroCrossings: number = 0;

    private config: CoSimulationConfig;

    private algorithmConstructors = [
        FixedStepAlgorithm,
        VariableStepAlgorithm
    ];

    private constraintConstructors = [
        ZeroCrossingConstraint,
        BoundedDifferenceConstraint,
        SamplingRateConstraint,
        FmuMaxStepSizeConstraint
    ];

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig
            .parse(this.path, project.getRootFilePath(), project.getFmusPath())
            .then(config => {
                this.zone.run(() => {
                    this.config = config;

                    this.parseError = null;

                    // Create an array of the algorithm from the coe config and a new instance of all other algorithms
                    this.algorithms = this.algorithmConstructors
                        .map(constructor =>
                            config.algorithm instanceof constructor
                                ? config.algorithm
                                : new constructor()
                        );
                    // Create an array of formGroups for the algorithms
                    this.algorithms.forEach(algorithm => {
                        this.algorithmFormGroups.set(algorithm, algorithm.toFormGroup());
                    });
                    // Create an array of all output ports on all instances
                    this.outputPorts = this.config.multiModel.fmuInstances
                        .map(instance => instance.fmu.scalarVariables
                            .filter(sv => sv.type === ScalarVariableType.Real && (sv.causality === CausalityType.Output || sv.causality === CausalityType.Parameter))
                            .map(sv => this.config.multiModel.getInstanceScalarPair(instance.fmu.name, instance.name, sv.name)))
                        .reduce((a, b) => a.concat(...b), []);

                    // Create a form group for validation
                    this.form = new FormGroup({
                        startTime: new FormControl(config.startTime, [Validators.required, numberValidator]),
                        endTime: new FormControl(config.endTime, [Validators.required, numberValidator]),
                        liveGraphs:  new FormArray(config.liveGraphs.map(g => g.toFormGroup()), uniqueGroupPropertyValidator("id")),//, uniqueGroupPropertyValidator("id")
                        livestreamInterval: new FormControl(config.livestreamInterval, [Validators.required, numberValidator]),
                        liveGraphColumns: new FormControl(config.liveGraphColumns, [Validators.required, numberValidator]),
                        liveGraphVisibleRowCount: new FormControl(config.liveGraphVisibleRowCount, [Validators.required, numberValidator]),
                        algorithm: this.algorithmFormGroups.get(this.config.algorithm),
                        global_absolute_tolerance: new FormControl(config.global_absolute_tolerance, [Validators.required, numberValidator]),
                        global_relative_tolerance: new FormControl(config.global_relative_tolerance, [Validators.required, numberValidator])
                    }, null, lessThanValidator('startTime', 'endTime'));
                });
            }, error => this.zone.run(() => { this.parseError = error })).catch(error => console.error(`Error during parsing of config: ${error}`));
    }

    public setPostProcessingScript(config: CoSimulationConfig, path: string) {
        config.postProcessingScript = config.getProjectRelativePath(path);
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;

        if (this.form.valid) {
            if (confirm("Save your work before leaving?"))
                this.onSubmit();

            return true;
        } else {
            return confirm("The changes to the configuration are invalid and can not be saved. Continue anyway?");
        }
    }

    onAlgorithmChange(algorithm: ICoSimAlgorithm) {
        this.config.algorithm = algorithm;

        this.form.removeControl('algorithm');
        this.form.addControl('algorithm', this.algorithmFormGroups.get(algorithm));
    }

    onSubmit() {
        if (!this.editing) return;

        this.warnings = this.config.validate();

        let override = false;

        if (this.warnings.length > 0) {

            let remote = require("electron").remote;
            let dialog = remote.dialog;
            let res = dialog.showMessageBox({ title: 'Validation failed', message: 'Do you want to save anyway?', buttons: ["No", "Yes"] });

            if (res == 0) {
                return;
            } else {
                override = true;
                this.warnings = [];
            }
        }

        if (override) {
            this.config.saveOverride()
                .then(() => this.change.emit(this.path));
        } else {
            this.config.save()
                .then(() => this.change.emit(this.path));
        }



        this.editing = false;
    }

    getOutputs(scalarVariables: Array<ScalarVariable>) {
        return scalarVariables.filter(variable => (variable.causality === CausalityType.Output || variable.causality === CausalityType.Local));
    }

    getFilterTypes(scalarVariables: Array<InstanceScalarPair>, types:ScalarVariableType[]){
      
        return scalarVariables.filter(v => types.indexOf(v.scalarVariable.type) > -1);
    }



    restrictToCheckedLogVariables(instance: Instance, scalarVariables: Array<ScalarVariable>) {
        return scalarVariables.filter(variable => this.isLogVariableChecked(instance, variable));
    }

    addConstraint() {
        if (!this.newConstraint) return;

        let algorithm = <VariableStepAlgorithm>this.config.algorithm;
        let formArray = <FormArray>this.form.find('algorithm').find('constraints');
        let constraint = new this.newConstraint();
        algorithm.constraints.push(constraint);
        formArray.push(constraint.toFormGroup());
    }

    removeConstraint(constraint: VariableStepConstraint) {
        let algorithm = <VariableStepAlgorithm>this.config.algorithm;
        let formArray = <FormArray>this.form.find('algorithm').find('constraints');
        let index = algorithm.constraints.indexOf(constraint);

        algorithm.constraints.splice(index, 1);
        formArray.removeAt(index);
    }


    addLiveGraph() {
        let g = new LiveGraph();
        this.config.liveGraphs.push(g);
        let formArray = <FormArray>this.form.find('liveGraphs');
        formArray.push(g.toFormGroup());
    }

    removeGraph(graph: LiveGraph)
    {
        let formArray = <FormArray>this.form.find('liveGraphs');
        let index = this.config.liveGraphs.indexOf(graph);
        this.config.liveGraphs.splice(index, 1);
        formArray.removeAt(index);
    }

    getConstraintName(constraint: any) {
        if (constraint === ZeroCrossingConstraint || constraint instanceof ZeroCrossingConstraint)
            return "Zero Crossing";
        if (constraint === FmuMaxStepSizeConstraint || constraint instanceof FmuMaxStepSizeConstraint)
            return "FMU Max Step Size";

        if (constraint === BoundedDifferenceConstraint || constraint instanceof BoundedDifferenceConstraint)
            return "Bounded Difference";

        if (constraint === SamplingRateConstraint || constraint instanceof SamplingRateConstraint)
            return "Sampling Rate";
    }



    isLogVariableChecked(instance: Instance, output: ScalarVariable) {
        let variables = this.config.logVariables.get(instance);

        if (!variables) return false;

        return variables.indexOf(output) !== -1;
    }

    isLocal(variable: ScalarVariable): boolean {
        return variable.causality === CausalityType.Local
    }

    getScalarVariableTypeName(type: ScalarVariableType) {
        return ScalarVariableType[type];
    }


    onLogVariableChange(enabled: boolean, instance: Instance, output: ScalarVariable) {
        let variables = this.config.logVariables.get(instance);

        if (!variables) {
            variables = [];
            this.config.logVariables.set(instance, variables);
        }

        if (enabled)
            variables.push(output);
        else {
            variables.splice(variables.indexOf(output), 1);

            if (variables.length == 0)
                this.config.logVariables.delete(instance);
        }
    }

    onLogVariablesKey(event: any) {
        this.logVariablesSearchName = event.target.value;
    }
}
