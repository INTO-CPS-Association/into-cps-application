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

import { ParetoDimension,DseConfiguration,DseParameterConstraint, DseScenario, DseObjectiveConstraint,IDseObjective, ObjectiveParam, ExternalScript, IDseAlgorithm, DseParameter, IDseRanking, ParetoRanking, GeneticSearch, ExhaustiveSearch} from "./dse-configuration"
import { Fmu, InstanceScalarPair, Instance, ScalarVariable, CausalityType } from "../angular2-app/coe/models/Fmu";


export class DseParser{
    protected SEARCH_ALGORITHM_TAG: string = "algorithm"
    protected SEARCH_ALGORITHM_TYPE:string = "type"
    protected SEARCH_ALGORITHM_GENETIC:string="genetic"
    protected SEARCH_ALGORITHM_EXHAUSTIVE:string="exhaustive"
    
    protected OBJECTIVE_CONSTRAINT_TAG: string = "objectiveConstraints"
    protected OBJECTIVES_TAG: string = "objectiveDefinitions"

    protected EXTERNAL_SCRIPT_TAG: string = "externalScripts"
    protected EXTERNAL_SCRIPT_FILE_TAG: string = "scriptFile"
    protected EXTERNAL_SCRIPT_PARAMS_TAG: string = "scriptParameters"

    protected INTERNAL_FUNCTION_TAG: string = "internalFunctions"
    protected INTERNAL_FUNCTION_COLUMN_TAG: string = "columnID"
    protected INTERNAL_FUNCTION_OBJECTIVE_TYPE_TAG: string = "objectiveType"

    protected PARAMETER_CONSTRAINT_TAG: string = "parameterConstraints"
    protected PARAMETERS_TAG: string = "parameters"
   
    protected RANKING_TAG: string = "ranking"
    protected RANKING_PARETO_TAG: string = "pareto"

    protected SCENARIOS_TAG: string = "scenarios"


    /*
     * Method for parsing DSE search algorithms. If no algorithm is defined, will assume is 
     * an exhaustive. Exhaustive searching requires no additional parsing, if genetic is 
     * found, then will require further parsing.
     */
    parseSearchAlgorithm(data: any, dse:DseConfiguration) {
        let algorithm = data[this.SEARCH_ALGORITHM_TAG]
        //If no algorithm set, assume is exhaustive
        if(!algorithm) {
            let al = new ExhaustiveSearch();
            dse.newSearchAlgortihm(al);
            return;
        };
        //Get algorithm type
        let type = algorithm[this.SEARCH_ALGORITHM_TYPE]
        if(type === this.SEARCH_ALGORITHM_GENETIC){
            let al = this.parseSearchAlgorithmGenetic(algorithm);
            dse.newSearchAlgortihm(al);
        }
        else if (type=== this.SEARCH_ALGORITHM_EXHAUSTIVE){
            let al = new ExhaustiveSearch();
            dse.newSearchAlgortihm(al);
        }
    }


    /*
     * Genetic algorithm parsing simply parses various floats and strings and creates a GeneticSearch object.
     */
    private parseSearchAlgorithmGenetic(algorithm: any) : IDseAlgorithm
    {   
        let initialPopulation : number = parseFloat(algorithm["initialPopulation"]);
        let initialPopulationDistribution : string = algorithm["initialPopulationDistribution"];
        let mutationProbability : number = parseFloat(algorithm["mutationProbability"]);
        let parentSelectionStrategy : string = algorithm["parentSelectionStrategy"];
        let maxGenerationsWithoutImprovement : number = parseFloat(algorithm["maxGenerationsWithoutImprovement"]);
        return new GeneticSearch(initialPopulation, initialPopulationDistribution, mutationProbability, parentSelectionStrategy,maxGenerationsWithoutImprovement)
    }


    /*
     * Objective constraint parsing method. Adds a list of objective constraint objects to the DSE config
     */
    parseObjectiveConstraint(data: any, dse:DseConfiguration) {
        let objConstList : DseObjectiveConstraint[] = [];
        
        if (Object.keys(data).indexOf(this.OBJECTIVE_CONSTRAINT_TAG) > 0){
            let objConst = data[this.OBJECTIVE_CONSTRAINT_TAG];
            //For each constraint string, create a DseObjectiveConstraint object and add to the list
            objConst.forEach(function(value:string) {
                let newParamConstraint = new DseObjectiveConstraint(value);
                objConstList.push(newParamConstraint);
            })
        }
        dse.newObjectiveConstraint(objConstList);
    }


    /*
     * Parameter constraint parsing method. Adds a list of parameters constraint objects to the DSE config
     */
    parseParameterConstraints(data: any, dse:DseConfiguration) {
        let paramConstList : DseParameterConstraint[] = [];

        if (Object.keys(data).indexOf(this.PARAMETER_CONSTRAINT_TAG) > 0){
            let paramConst = data[this.PARAMETER_CONSTRAINT_TAG];
            paramConst.forEach(function(value:string) {
            //For each constraint string, create a DseParameterConstraint object and add to the list
                let newParamConstraint = new DseParameterConstraint(value);
                paramConstList.push(newParamConstraint);
            })
        }
        dse.newParameterConstraint(paramConstList);
    }



    /*
     * Method to parse a collection of parameters, ensures parameters are added to the DSE config.
     */
    parseParameters(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.PARAMETERS_TAG) >= 0) {
            let parameterData = data[this.PARAMETERS_TAG];
            //for each dse parameter...
            $.each(Object.keys(parameterData), (j, id) => {
                let values = parameterData[id];

                let ids = this.parseId(id);
                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                //Either get a pre-parsed instance and add the new value, or create a new one 
                var param = dse.getInstanceOrCreate(fmuName, instanceName);
                param.initialValues.set(param.fmu.getScalarVariable(scalarVariableName), values);
            });
        }
    }



    /*
     * Method to parse a collection of external script objectives. Iterates through the 
     * collection and calls auxiallary method.
     */
    parseExtScrObjectives(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.OBJECTIVES_TAG) >= 0) {
            let objData = data[this.OBJECTIVES_TAG];
            //For each external script objective in the json, parse it
            $.each(Object.keys(objData), (j, id) => {
                if (id == this.EXTERNAL_SCRIPT_TAG){
                    this.parseExternalScript(objData[id], dse);
                }
            });
        }
    }


    /*
     * Method to parse a single external script objective. Adds the external script to the DSE config.
     */
    private parseExternalScript(data: any, dse:DseConfiguration){
        $.each(Object.keys(data), (j, id) => {
            let objEntries = data[id];
            //GET SCRIPT NAME
            let extName = objEntries[this.EXTERNAL_SCRIPT_FILE_TAG];
            let paramList = objEntries[this.EXTERNAL_SCRIPT_PARAMS_TAG];
            let objParams : ObjectiveParam [] = [];
            //GET SCRIPT PARAMETERS
            $.each(Object.keys(paramList), (j, id2) => {
                let pName = paramList[id2];
                let pTp = "";
                if(pName.charAt(0)=='{'){
                    pTp = "model output"
                }
                else if (pName == "time" || pName == "step-size"){
                    pTp = "simulation value"
                } 
                else pTp = "constant";

                let newParam = new ObjectiveParam(id2, pName, pTp);
                objParams.push(newParam);
            });
            //add the new external script
            dse.newExternalScript(id, extName, objParams);
        });
    }




    /*
     * Method to parse a collection of internal function objectives. Iterates through the 
     * collection and calls auxiallary method.
     */
    parseIntFuncsObjectives(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.OBJECTIVES_TAG) >= 0) {
            let objData = data[this.OBJECTIVES_TAG];
            //For each internal function objective in the json, parse it
            $.each(Object.keys(objData), (j, id) => {
                if (id == this.INTERNAL_FUNCTION_TAG){
                    this.parseInternalFunction(objData[id], dse);
                }
            });
        }
    }


    /*
     * Method to parse a single internal function objective. Adds the internal function to the DSE config.
     */
    private parseInternalFunction(data: any, dse:DseConfiguration){
        $.each(Object.keys(data), (j, id) => {
            let objEntries = data[id];
            //GET SCRIPT NAME
            let columnID = objEntries[this.INTERNAL_FUNCTION_COLUMN_TAG];
            let objTp = objEntries[this.INTERNAL_FUNCTION_OBJECTIVE_TYPE_TAG];
            
            //add the new internal function
            dse.newInternalFunction(id, columnID, objTp);
         });
    }



    /*
     * Method to parse the DSE ranking. Currently if no ranking is defined, assumes will be a pareto rank.
     * Only pareto ranking is supported. Adds the parsed ranking to the DSE config.
     */
    parseRanking(data: any, dse:DseConfiguration){
        let ranking = data[this.RANKING_TAG];
        if(!ranking){
            //assume is Pareto if not defined.
            dse.newRanking(this.newPareto());
            return;
        }
        let ranktype = ranking[this.RANKING_PARETO_TAG]
        if(ranktype) dse.newRanking(this.parseParetoRanking(ranktype));
        //check other rank types as added to backend
    }


    /*
     * Method to parse Pareto ranking. Will add Pareto dimensions to a new Pareto ranking object.
     */
    private parseParetoRanking(data:any) : IDseRanking{
        let paretoDimensions: ParetoDimension [] = [];
        $.each(Object.keys(data), (j, id) => {
            let value = data[id];
            paretoDimensions.push(new ParetoDimension(id, value));
        });
        return new ParetoRanking(paretoDimensions);
    }

    private newPareto() : IDseRanking{
        return new ParetoRanking([]);
    }


    /*
     * Method for parsing the scenario list. If no scenarios are defined, an empty list is used.
     * Alternativly each scenario is added to a list added to the DSE config.
     */
    parseScenarios(data: any, dse:DseConfiguration) {
        let scenarios = data[this.SCENARIOS_TAG];

        let scenarioList : DseScenario[] = [];
        if(!scenarios) {
            let sc = new DseScenario("");
            scenarioList.push(sc);
            dse.newScenario(scenarioList);
            return;
        };
        scenarios.forEach(function(value:string) {
            let newsc = new DseScenario(value);
            scenarioList.push(newsc);
        })
        dse.newScenario(scenarioList);
    }


    parseSimpleTag(data: any, tag: string): any {
        return data[tag] !== undefined ? data[tag] : null;
    }

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
}
