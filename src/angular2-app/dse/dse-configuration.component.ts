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

import { Component, Input, NgZone, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import {Serializer} from "../../intocps-configurations/Parser";
import {
    Instance, ScalarVariable, CausalityType, InstanceScalarPair, isCausalityCompatible, isTypeCompatiple,
    Fmu, ScalarValuePair, ScalarVariableType
} from "../coe/models/Fmu";
import {CoeSimulationService} from "../coe/coe-simulation.service";
import IntoCpsApp from "../../IntoCpsApp";
import {Http} from "@angular/http";
import {SettingsService, SettingKeys} from "../shared/settings.service";
import {ParetoDimension, InternalFunction, DseConfiguration, ParetoRanking, ExternalScript, DseParameter, DseScenario, DseParameterConstraint, DseObjectiveConstraint,IDseAlgorithm, GeneticSearch, ExhaustiveSearch} from "../../intocps-configurations/dse-configuration";
import { WarningMessage } from "../../intocps-configurations/Messages";
import { NavigationService } from "../shared/navigation.service";
import { FormGroup, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, FormArray, FormControl, Validators } from "@angular/forms";
import {IProject} from "../../proj/IProject";
import {Project} from "../../proj/Project";
import * as Path from 'path';
import * as fs from 'fs';
import {coeServerStatusHandler} from "../../menus";
import {OutputConnectionsPair} from "../coe/models/Fmu";

@Component({
    selector: "dse-configuration",
    providers: [
        CoeSimulationService
    ],
    templateUrl: "./angular2-app/dse/dse-configuration.component.html",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES
    ]    
})
export class DseConfigurationComponent implements OnInit, OnDestroy {
    private _path:string;

    @Input()
    set path(path:string) {
        this._path = path;

        if (path){
            let app: IntoCpsApp = IntoCpsApp.getInstance();
            let p: string = app.getActiveProject().getRootFilePath();
            this.cosimConfig = this.loadCosimConfigs(Path.join(p, Project.PATH_MULTI_MODELS));

            if(this.coeSimulation)
                this.coeSimulation.reset();
        }
    }
    get path():string {
        return this._path;
    }

    @Output()
    change = new EventEmitter<string>();

    form: FormGroup;
    algorithms: IDseAlgorithm[] = [];
    algorithmFormGroups = new Map<IDseAlgorithm, FormGroup>();
    editing: boolean = false;
    editingMM: boolean = false;
    warnings: WarningMessage[] = [];
    parseError: string = null;

    mmSelected:boolean = false;
    mmPath:string = '';
    
    config : DseConfiguration;
    cosimConfig:string[] = [];
    mmOutputs:string[] = [];
    objNames:string[] = [];
    coeconfig:string = '';

    online:boolean = false;
    url:string = '';
    version:string = '';
    dseWarnings:WarningMessage[] = [];
    coeWarnings:WarningMessage[] = [];

    private onlineInterval:number;
    
    private selectedParameterInstance: Instance;

    private newParameter: ScalarVariable;

    private algorithmConstructors = [
        ExhaustiveSearch,
        GeneticSearch
    ];

    //Collection of arrays to use for drop-boxes. Some may be expanded as the backend is developed
    private geneticPopulationDistribution = ["random"];//To add in when backend works["random", "uniform"];
    private geneticParentSelectionStrategy = ["random"];//["random", "algorithmObjectiveSpace","algorithmDesignSpace"];
    private internalFunctionTypes = ["max", "min","mean"];
    private externalScriptParamTp = ["model output", "constant", "simulation value"];
    private simulationValue = ["step-size", "time"];
    private paretoDirections = ["-", "+"];

  
    constructor(private coeSimulation:CoeSimulationService,
        private http:Http,
        private zone:NgZone,
        private settings:SettingsService, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    parseConfig(mmPath : string) {
       let project = IntoCpsApp.getInstance().getActiveProject();
       
       DseConfiguration
           .parse(this.path, project.getRootFilePath(), project.getFmusPath(), mmPath)
           .then(config => {
                this.zone.run(() => {
                    this.config = config;
                    //retrieve information to use for validation purposes
                    this.objNames = this.getObjectiveNames();
                    this.mmOutputs = this.loadMMOutputs();

                    // Create an array of the algorithm from the coe config and a new instance of all other algorithms
                    this.algorithms = this.algorithmConstructors
                        .map(constructor =>
                            config.searchAlgorithm instanceof constructor
                                ? config.searchAlgorithm
                                : new constructor()
                        );
                    // Create an array of formGroups for the algorithms
                    this.algorithms.forEach(algorithm => {
                        this.algorithmFormGroups.set(algorithm, algorithm.toFormGroup());
                    });
                    
                    // Create a form group for validation
                    this.form = new FormGroup({
                        searchAlgorithm :  this.algorithmFormGroups.get(this.config.searchAlgorithm),
                        paramConstraints : new FormArray(this.config.paramConst.map(c => new FormControl(c))),
                        objConstraints : new FormArray(this.config.objConst.map(c => new FormControl(c))),
                        extscr : new FormArray(this.config.extScrObjectives.map(s => new FormControl(s))),
                        scenarios : new FormArray(this.config.scenarios.map(s => new FormControl(s)))
                    });
                });
           }, error => this.zone.run(() => {this.parseError = error})).catch(error => console.error(`Error during parsing of config: ${error}`));
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

        this.config.save()
                .then(() => this.change.emit(this.path));
       
        this.editing = false;
    }

    /*
     * Method to state that the multi-model has been chosen for the DSE config
     */
    onMMSubmit() {
        if (!this.editingMM) return;
        this.editingMM = false;
        if (this.mmPath !='')
        {
            this.mmSelected = true;
        }
    }
    

    getFiles(path: string): string [] {
        var fileList: string[] = [];
        var files = fs.readdirSync(path);
        for(var i in files){
            var name = Path.join(path, files[i]);
            if (fs.statSync(name).isDirectory()){
                fileList = fileList.concat(this.getFiles(name));
            } else {
                fileList.push(name);
            }
        }
    
        return fileList;
    }

    loadCosimConfigs(path: string): string[] {
        var files: string[] = this.getFiles(path);
        return  files.filter(f => f.endsWith("coe.json"));
    }

    experimentName(path: string): string {
        let elems = path.split(Path.sep);
        let mm: string = elems[elems.length-2];
        let ex: string = elems[elems.length-3];
        return mm + " | " + ex;
    }

    getMultiModelName():string{
        return this.experimentName(this.mmPath);
    }

    onConfigChange(config:string) {
        this.coeconfig = config;
        let mmPath = Path.join(this.coeconfig, "..", "..", "mm.json");

        if (!fs.existsSync(mmPath)) {
            console.warn("Could not find mm at: " + mmPath + " initiating search or possible alternatives...")
            //no we have the old style
            fs.readdirSync(Path.join(this.coeconfig, "..", "..")).forEach(file => {
                if (file.endsWith("mm.json")) {
                    mmPath = Path.join(this.coeconfig, "..", "..", file);
                    console.debug("Found old style mm at: " + mmPath);
                    return;
                }
            });
        }
        this.mmPath=mmPath;
        this.parseConfig(mmPath);
    }

    /*
     * Method for updating the DSE algorithm
     */
    onAlgorithmChange(algorithm: IDseAlgorithm) {
        this.config.searchAlgorithm = algorithm;

        this.form.removeControl('algorithm');
        this.form.addControl('algorithm', this.algorithmFormGroups.get(algorithm));
    }

    getSearchAlgorithm(){
        return this.config.searchAlgorithm.getName()
    }

    setGeneticpopDist(dist: string) {
        //assume is a genetic search 
        (<GeneticSearch>this.config.searchAlgorithm).initialPopulationDistribution = dist;
    }

    setParentSelectionStrategy(strat: string) {
        //assume is a genetic search 
        (<GeneticSearch>this.config.searchAlgorithm).parentSelectionStrategy = strat;
    }

    /* REUSED FROM MM-CONFIG */
    selectParameterInstance(instance: Instance) {
        this.selectedParameterInstance = instance;
        this.newParameter = this.getParameters()[0];
    }

    /*
     * Get the parameters for a selected FMU instance (selected instance set as a state variable)
     */
    getParameters() {
        if (!this.selectedParameterInstance)
            return [null];

        return this.selectedParameterInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Parameter) && !this.selectedParameterInstance.initialValues.has(variable));
    }

    /*
     * Get the initial values for a selected FMU instance (selected instance set as a state variable)
     */
    getInitialValues(): Array<ScalarValuePair> {
        let initialValues: Array<ScalarValuePair> = [];

        this.selectedParameterInstance.initialValues.forEach((value, variable) => {
            initialValues.push(new ScalarValuePair(variable, value));
        });

        return initialValues;
    }

    getScalarTypeName(type: number) {
        return ['Real', 'Bool', 'Int', 'String', 'Unknown'][type];
    }

    /*
     * Add a new DSE parameter
     */
    addParameter() {
        if (!this.newParameter) return;

        this.selectedParameterInstance.initialValues.set(this.newParameter, []);
        this.newParameter = this.getParameters()[0];
      }

    /*
     * Remove the given DSE search parameter
     */
    removeParameter(instance: Instance, parameter: ScalarVariable) {
        instance.initialValues.delete(parameter);
        this.newParameter = this.getParameters()[0];
    }

    setParameterName(p: DseParameter, name: string) {
        p.param = `${name}`;
    }

    getParameterName(p:DseParameter){
        return p.param;
    }

    /*
     * Set the initial values for a DSE parameter. Will check types of values and also ensure 
     * parameter of choice is recorded in the DSE config.
     */ 
    setDSEParameter(instance: Instance, variableName:string, newValue: any) {
        if (!newValue.includes(",")){
            if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Real)
                newValue = parseFloat(newValue);
            else if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Int)
                newValue = parseInt(newValue);
            else if (instance.fmu.getScalarVariable(variableName).type === ScalarVariableType.Bool)
                newValue = !!newValue;
        }
        else{
            newValue = this.parseArray(instance.fmu.getScalarVariable(variableName).type, newValue);
        }

        let varExistsInDSE = false
        let instanceExistsInDSE = false

        //Need to determine if the DSE configuration knows firstly about the FMU instance, and then 
        //if it does AND has existing values for the given parameter, add the new value to the initial values.
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                instanceExistsInDSE = true
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                          dseParam.initialValues.set(variable, newValue)
                          varExistsInDSE = true
                    }
                })
            }
        }
        //If the config does not know about this instance, it is added with the given initial values
        if(!instanceExistsInDSE){
            let newInstance = this.addDSEParameter(instance);            
            newInstance.initialValues.set(instance.fmu.getScalarVariable(variableName), newValue);
        }
        //If the config knows about the instance but NOT the parameter values, they are added to the 
        //instance in the DSE config.
        if(!varExistsInDSE){
            for (let dseParam of this.config.dseSearchParameters) {
                if (dseParam.name === instance.name) {
                    dseParam.initialValues.set(instance.fmu.getScalarVariable(variableName), newValue);
                }
            }        
        }
    }

    /*
     * Record a new instance in the list of DSE parameters
     */ 
    addDSEParameter(instance: Instance):Instance{
        let newInstance = instance
        this.config.dseSearchParameters.push(newInstance);            
        return newInstance;
    }
    
    removeDSEParameter(instance: Instance, variableName:string) {
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.delete(instance.fmu.getScalarVariable(variableName));
            }
        }
    }

    parseArray(tp : ScalarVariableType, value: any):any []{
        let newArray = value.split(",")
        for(let v of newArray){
            if (tp === ScalarVariableType.Real)
                newArray.splice(newArray.indexOf(v),1, parseFloat(v));
            else if (tp === ScalarVariableType.Int)
                newArray.splice(newArray.indexOf(v),1, parseInt(v));
            else if (tp === ScalarVariableType.Bool)
                newArray.splice(newArray.indexOf(v),1, !!v);
        }
        return newArray
    }

    //Utility method to obtain an instance from the multimodel by its string id encoding
    private getParameter(dse: DseConfiguration, id: string): Instance {
        let ids = this.parseId(id);

        let fmuName = ids[0];
        let instanceName = ids[1];
        let scalarVariableName = ids[2];
        return dse.getInstanceOrCreate(fmuName, instanceName);
    }

    /*
     * Parse an FMU id
     */
    parseId(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name + '.' + scalar-variable
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after instance name";
        }
        let instanceName = rest.substring(0, dotIndex);
        let scalarVariableName = rest.substring(dotIndex + 1);

        return [fmuName, instanceName, scalarVariableName];
    }

    /*
     * Method to produce an array of outputs in the chosen multi-model
     */
    loadMMOutputs():string[]{
        let outputs :string []= [];

        this.config.multiModel.fmuInstances.forEach(instance => {
            instance.outputsTo.forEach((connections, scalarVariable) => {
                outputs.push(Serializer.getIdSv(instance, scalarVariable));
            });
        });

        return outputs;
    }

    customTrackBy(index: number, obj: any): any {
        return index;
    }

    dseParamExists(instance: Instance, variableName:string) :boolean{    
        let paramFound = false;
        
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                        paramFound = true;
                    }
                })
            }
        }
        return paramFound;
    }


    getDseParamValue(instance: Instance, variableName:string) :any{    
        let result = "ERROR";
        for (let dseParam of this.config.dseSearchParameters) {
            if (dseParam.name === instance.name) {
                dseParam.initialValues.forEach((value, variable) => {
                    if (variable.name === variableName){
                        result = value;
                    }
                })
            }
        }
        return result;
    }


    addParameterInitialValue(p: DseParameter, value: any) {
        p.addInitialValue(value);
    }

    getParameterIntialValues(p:DseParameter){
        return p.initialValues;
    }

    setParameterIntialValues(p:DseParameter, oldVal: any, newVal:any){
        return p.setInitialValue(oldVal, newVal);
    }

    removeParameterInitialValue(p: DseParameter, value: string) {
        p.removeInitialValue(value);
    }



    addParameterConstraint(){
        let pc = this.config.addParameterConstraint();
        let pcArray = <FormArray>this.form.find('paramConstraints');
        
        pcArray.push(new FormControl(this.getParameterConstraint(pc)));
    }

    setParameterConstraint(pc: DseParameterConstraint, name: string) {
        pc.constraint = `${name}`;
    }

    getParameterConstraint(pc:DseParameterConstraint){
        return pc.constraint;
    }

    removeParameterConstraint(pc:DseParameterConstraint){
        this.config.removeParameterConstraint(pc);
        let pcArray = <FormArray>this.form.find('paramConstraints');
        let index = this.config.paramConst.indexOf(pc);
        
        pcArray.removeAt(index);
    }



    addExternalScript(){
        let es = this.config.addExternalScript();
        this.objNames = this.getObjectiveNames();
    }

    getExternalScriptName(e: ExternalScript){
        return e.name;
    }

    setExternalScriptName(p: ExternalScript, name: string) {
        p.name = `${name}`;
        this.objNames = this.getObjectiveNames();
    }

    getExternalScriptFilename(e: ExternalScript){
        return e.fileName;
    }

    setExternalScriptFileName(p: ExternalScript, name: string) {
        p.fileName = `${name}`;
    }

    getExternalScriptParameters(e: ExternalScript){
        return e.parameterList;
    }

    addExternalScriptParameter(e: ExternalScript, value: any, tp: string) {
        e.addParameter(value, tp);
    }

    setExternalScriptParameterId(e:ExternalScript, param: any, newId:any){
        return e.setParameterId(param, newId);
    }

    setExternalScriptParameterValue(e:ExternalScript, param: any, newVal:any){
        return e.setParameterValue(param, newVal);
    }

    setExternalScriptParameterType(e:ExternalScript, param: any, newTp:string){
        return e.setParameterType(param, newTp);
    }

    removeExternalScriptParameter(e: ExternalScript, value: string) {
        e.removeParameter(value);
    }

    removeExternalScript(e:ExternalScript){
        this.config.removeExternalScript(e);
        this.objNames = this.getObjectiveNames();
    }



    addInternalFunction(){
        let intf = this.config.addInternalFunction();
        this.objNames = this.getObjectiveNames();
    }

    removeInternalFunction(i:InternalFunction){
        this.config.removeInternalFunction(i);
        this.objNames = this.getObjectiveNames();
    }

    getInternalFunctionName(i: InternalFunction){
        return i.name;
    }

    setInternalFunctionName(i: InternalFunction, name: string) {
        i.name = `${name}`;
        this.objNames = this.getObjectiveNames();
    }

    getInternalFunctionColumnName(i: InternalFunction){
        return i.columnId;
    }

    setInternalFunctionColumnName(i: InternalFunction, name: string) {
        i.columnId = `${name}`;
    }

    getInternalFunctionObjectiveType(i: InternalFunction){
        return i.funcType;
    }

    setInternalFunctionObjectiveType(i: InternalFunction, name: string) {
        i.funcType = `${name}`;
    }



    addObjectiveConstraint(){
        let oc = this.config.addObjectiveConstraint();
        let ocArray = <FormArray>this.form.find('objConstraints');
        
        ocArray.push(new FormControl(this.getObjectiveConstraint(oc)));
    }

    setObjectiveConstraint(oc: DseObjectiveConstraint, name: string) {
        oc.constraint = `${name}`;
    }

    getObjectiveConstraint(oc:DseObjectiveConstraint){
        return oc.constraint;
    }

    removeObjectiveConstraint(oc:DseObjectiveConstraint){
        this.config.removeObjectiveConstraint(oc);
        let ocArray = <FormArray>this.form.find('objConstraints');
        let index = this.config.objConst.indexOf(oc);
        
        ocArray.removeAt(index);
    }



    getRankingMethod(){
        return this.config.ranking.getType();
    }

    /*
     * Method to provide an array of all objective names
     */
    getObjectiveNames():string []{
        let objNames = [""];
        this.config.extScrObjectives.forEach((o:ExternalScript) =>{
            objNames.push(o.name)
        });
        this.config.intFunctObjectives.forEach((o:InternalFunction) =>{
            objNames.push(o.name)
        });
        
        return objNames;
    }

    getRankingDimensions(){
        return (<ParetoRanking> this.config.ranking).getDimensions();
    }

    getDimensionName(d:ParetoDimension){
        return d.getObjectiveName()
    }

    setDimensionName(d:ParetoDimension, name: string){
        d.objectiveName = name;
    }

    onDimensionChange(pd: ParetoDimension, d:string){
        pd.objectiveName = d;
    }

    getDimensionDirection(d:ParetoDimension){
        return d.getDirection()
    }

    setDimensionDirection(d :ParetoDimension, direct :string){
        d.direction = direct;
    }

    removeParetoDimension(d:ParetoDimension){
        (<ParetoRanking> this.config.ranking).removeDimension(d);
    }

    addParetoDimension(objective:string, direction:string){
        if (this.config.ranking instanceof ParetoRanking){
            (<ParetoRanking> this.config.ranking).addDimension(objective, direction);
        }
    }


    addScenario(){
        let s = this.config.addScenario();
        let sArray = <FormArray>this.form.find('scenarios');
        
        sArray.push(new FormControl(this.getScenario(s)));
    }

    setScenario(s: DseScenario, name: string) {
        s.name = `${name}`;
    }

    getScenario(s:DseScenario){
        return s.name;
    }

    removeScenario(s:DseScenario){
        this.config.removeScenario(s);
        let sArray = <FormArray>this.form.find('scenarios');
        let index = this.config.scenarios.indexOf(s);
        
        sArray.removeAt(index);
    }




    ngOnInit() {
        this.url = this.settings.get(SettingKeys.COE_URL) || "localhost:8082";
        this.onlineInterval = window.setInterval(() => this.isCoeOnline(), 2000);
        this.isCoeOnline();
    }

    ngOnDestroy() {
        clearInterval(this.onlineInterval);
    }

    /*
     * Method to check if can run a DSE. Will check if the COE is online, if there are any warnings
     * and also some DSE-specific elements
     */
    canRun() {
        return this.online
            && this.coeconfig != ""
            && this.dseWarnings.length === 0
            && this.coeWarnings.length === 0
            //&& this.config.dseSearchParameters.length > 1 
            && (this.config.extScrObjectives.length + this.config.intFunctObjectives.length) >= 2;
            //&& (<ParetoRanking> this.config.ranking).dimensions.length == 2;
    }

    /*
     * Method to run a DSE with the current DSE configuration. Assumes that the DSE can be run. 
     * The method does not need to send the DSEConfiguration object, simply the correct paths. It relies upon the
     * config being saved to json format correctly.
     */
    runDse() {
        var spawn = require('child_process').spawn;
        let installDir = IntoCpsApp.getInstance().getSettings().getValue(SettingKeys.INSTALL_TMP_DIR);

        let absoluteProjectPath = IntoCpsApp.getInstance().getActiveProject().getRootFilePath();
        let experimentConfigName = this._path.slice(absoluteProjectPath.length + 1, this._path.length);
        let multiModelConfigName = this.coeconfig.slice(absoluteProjectPath.length + 1, this.coeconfig.length); 

        //Using algorithm selector script allows any algortithm to be used in a DSE config.
        let scriptFile = Path.join(installDir, "dse", "Algorithm_selector.py"); 
        var child = spawn("python", [scriptFile, absoluteProjectPath, experimentConfigName, multiModelConfigName], {
            detached: true,
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            console.log('dse/stdout: ' + data);
        });
        child.stderr.on('data', function (data: any) {
            console.log('dse/stderr: ' + data);
        });
    }

    isCoeOnline() {
        this.http
            .get(`http://${this.url}/version`)
            .timeout(2000)
            .map(response => response.json())
            .subscribe((data:any) => {
                this.online = true;
                this.version = data.version;
            }, () => this.online = false);
    }

    onCoeLaunchClick() {
        coeServerStatusHandler.openWindow("autolaunch");
    }
}
