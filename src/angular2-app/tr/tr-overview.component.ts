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

import {OnInit, Component, Input, NgZone} from "@angular/core";
//import {MultiModelConfig} from "../../intocps-configurations/MultiModelConfig";
//import {Serializer} from "../../intocps-configurations/Parser";
import IntoCpsApp from "../../IntoCpsApp";

export class TrOverviewComponent{
    public headerString:string;

    public mainObjectPropertyName1:string;
    public mainObjectPropertyName2:string;
    public mainObjectPropertyID1:string;
    public mainObjectPropertyID2:string;
    public lso:any;

    public findAllMainObjects:string;

    public subObjectClasses:subObjectClass[];
    public _selectedSubObjectClass:subObjectClass;


    public mainObjecList:Array<subObject>;
    public subObjecList:Array<subObject>;
    private intoApp:IntoCpsApp;
    private zone:NgZone;
    private resultsAvailible:Boolean;
    private sourcesAvailible:Boolean;
    public _findSourcesFor:subObject;

    constructor(zone:NgZone) {
        this.subObjectClasses =  new Array<subObjectClass>();
        this.resultsAvailible = false;
        this.sourcesAvailible = false;
        this.zone = zone;
        this.intoApp = IntoCpsApp.getInstance();
    }
    @Input()
    set selectedSubObjectClass(selectedSubObjectClass:subObjectClass) {
        this._selectedSubObjectClass = selectedSubObjectClass;
    }
    get selectedSubObjectClass() {
        return this._selectedSubObjectClass;
    }
    @Input()
    set findSourcesFor(findSourcesFor:subObject) {
        this._findSourcesFor = findSourcesFor;
        if (findSourcesFor.listSources){
            findSourcesFor.listSources = false;
        }else{
            for(var resInd in this.mainObjecList){
                this.mainObjecList[resInd].listSources = false;
            }
            findSourcesFor.listSources = true;
        }
        if (this._findSourcesFor)
            this.updateSources();
    }
    get findSourcesFor() {
        return this._findSourcesFor;
    }

    getResults(){
        return this.mainObjecList;
    }


    protected updatemainObjects(){
        this.resultsAvailible = false;
        this.mainObjecList = Array<subObject>();
        this.intoApp.trmanager.sendCypherQuery(this.findAllMainObjects)
            .then(this.parsemainObjects.bind(this));
    }

    private getSourceQuery(startUri:string):string{
        return this.selectedSubObjectClass.findAllSubObjectsPart1 + startUri + this.selectedSubObjectClass.findAllSubObjectsPart2;
    }

    private updateSources(){
        this.sourcesAvailible = false;
        this.subObjecList = Array<subObject>();
        this.intoApp.trmanager.sendCypherQuery(this.getSourceQuery(this._findSourcesFor.subObjectProperty2))
            .then(this.parseSourceResults.bind(this));
    }

    private parsemainObjects(results: any[]){
        for(var result in results){
            this.mainObjecList.push(new subObject(results[result], this.mainObjectPropertyID1, this.mainObjectPropertyID2, this.subObjectClasses[0]));
        }
        this.zone.run(() => this.resultsAvailible = true);
    }

    private parseSourceResults(results: any){
        for(var result in results){
            this.subObjecList.push(new subObject(results[result], this.selectedSubObjectClass.subObjectPropertyID1, this.selectedSubObjectClass.subObjectPropertyID2));
        }
        this.zone.run(() => this.sourcesAvailible = true);
    }

}

class subObject {
    public listSources:Boolean;
    public selectedsubObjectClass:subObjectClass;
    public subObjectPropertyID1:string;
    public subObjectPropertyID2:string;
    public subObjectProperty1:string;
    public subObjectProperty2:string;
    constructor(resultObject:any, subObjectPropertyID1:string, subObjectPropertyID2:string, startValuesubObjectClass?:subObjectClass){
        this.subObjectPropertyID1 = subObjectPropertyID1;
        this.subObjectPropertyID2 = subObjectPropertyID2;
        this.subObjectProperty1 = resultObject[this.subObjectPropertyID1];
        this.subObjectProperty2 = resultObject[this.subObjectPropertyID2];
        this.listSources = false;
        this.selectedsubObjectClass = startValuesubObjectClass;
    }
    
}

export class  subObjectClass{
    public name:string;
    public subObjectPropertyName1:string;
    public subObjectPropertyName2:string;
    public subObjectPropertyID1:string;
    public subObjectPropertyID2:string;
    public findAllSubObjectsPart1:string;
    public findAllSubObjectsPart2:string;

}
