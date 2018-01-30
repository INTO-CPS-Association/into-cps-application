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

import * as GitConn from "./git-connection"
import * as uuid from "uuid"
import { IntoCpsApp } from "./../IntoCpsApp";

interface Entity {
    serialize(): any;
    shortSerialize(): any;
}

class MsgCreator {

    private serializedObject: any = {};

    constructor() { }

    public static CreateMsg() {
        return new MsgCreator();
    }

    public getSerializedObject() {
        return this.serializedObject;
    }

    public setDefaultRootEntries() {
        this.serializedObject["xmlns:rdf"] = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
        this.serializedObject["xmlns:prov"] = "http://www.w3.org/ns/prov#";
        //this.serializedObject["xmlns:intocps"] = "http://www.w3.org/ns/intocps#";
        this.serializedObject["messageFormatVersion"] = "1.5"
        return this;
    }

    public setAbout(about: string) {
        if (about)
            this.serializedObject["rdf:about"] = about;
        return this;
    }
    public setActivity(activity: any){
        if(activity)
        {
            this.serializedObject["prov:Activity"] = activity;
            return this;
        }
    }
    public setActivities(activities: any) {
        if (activities)
            this.serializedObject["prov:Activity"] = activities;
        return this;
    }

    public setEntities(entities: any) {
        if (entities)
            this.serializedObject["prov:Entity"] = entities;
        return this;
    }

    public setUsed(used: any) {
        if (used)
            this.serializedObject["prov:used"] = used;
        return this;
    }

    public setWasGeneratedBy(wasGeneratedBy: any) {
        if (wasGeneratedBy)
            this.serializedObject["prov:wasGeneratedBy"] = wasGeneratedBy;
        return this;
    }

    public setWasDerivedFrom(wasDerivedFrom: any) {
        if (wasDerivedFrom)
            this.serializedObject["prov:wasDerivedFrom"] = wasDerivedFrom;
        return this;
    }

    public setWasAttributedTo(wasAttributedTo: any) {
        if (wasAttributedTo)
            this.serializedObject["prov:wasAttributedTo"] = wasAttributedTo;
        return this;
    }

    public setWasAssociatedWith(wasAssociatedWith: any) {
        if (wasAssociatedWith)
            this.serializedObject["prov:wasAssociatedWith"] = wasAssociatedWith;
        return this;
    }

    public setAgent(agent: any) {
        if (agent)
            this.serializedObject["prov:Agent"] = agent;
        return this;
    }

    public setTime(time: string) {
        if (time)
            this.serializedObject["time"] = time;
        return this;
    }
    public setType(type: string) {
        if (type)
            this.serializedObject["type"] = type;
        return this;
    }

    public setHash(hash: string) {
        if (hash)
            this.serializedObject["hash"] = hash;
        return this;
    }

    public setPath(path: string) {
        if (path)
            this.serializedObject["path"] = path;
        return this;
    }

    public setCommit(commit: string) {
        if (commit)
            this.serializedObject["commit"] = commit;
        return this;
    }

    public setUrl(url: string) {
        if (url)
            this.serializedObject["url"] = url;
        return this;
    }

    public setVersion(version: string) {
        if (version)
            this.serializedObject["version"] = version;
        return this;
    }

    public setName(name: string) {
        if (name)
            this.serializedObject["name"] = name;
        return this;
    }

    public setEmail(email: string) {
        if (email)
            this.serializedObject["email"] = email;
        return this;
    }
}

export class RootMessage {
    public entities: Array<Entity> = new Array<Entity>();
    public activities: Array<Activity> = new Array<Activity>();
    public agents: Array<EntityAgent> = new Array<EntityAgent>();

    public serialize(): any {

         var root:any = {};
        root["rdf:RDF"] =  MsgCreator.CreateMsg()
                .setDefaultRootEntries()
                .setActivities(this.activities.length > 0 ? this.activities.map((activity) => activity.serialize()) : null)
                .setEntities(this.entities.length > 0 ? this.entities.map((entity) => entity.serialize()) : null)
                .setAgent(this.agents.length > 0 ? this.agents.map((agent) => agent.serialize()) : null)
                .getSerializedObject()

            return root;
    }
}

export class Activity {
    // rdf
    // required
    public about: string;

    //into-cps
    // required
    public time: string;
    // required
    public type: ActivityTypeOptions;

    //prov
    // optional
    public used: Array<Entity> = new Array<Entity>();
    //optional
    public wasAssociatedWith: EntityAgent = new EntityAgent();


    public unique: string;

    public constructor() {
        this.unique = uuid.v4();
        this.setTimeToNow();
    }

    public setTimeToNow() {
        this.time = (new Date()).toISOString().split('.')[0]+"Z";
    }

    public calcAndSetAbout() {
        this.about = `Activity.${this.type}:${this.time}#${this.unique}`
    }

    private canBeSerialized() {
        if (!(this.about && this.unique && this.type && this.time)) {
            console.error(`It was not possible to serialize the activity. One of the following values are not allowed: about[${this.about}], unique[${this.unique}], type[${this.type}] or/and time[${this.time}]`)
            return false;
        }
        else
            return true;
    }

    public serialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setTime(this.time)
                .setType(this.type)
                .setUsed(this.used ? MsgCreator.CreateMsg().setEntities(this.used.map((entity) => entity.shortSerialize())).getSerializedObject() : null)
                .setWasAssociatedWith(this.wasAssociatedWith ? this.wasAssociatedWith.shortSerialize() : null)
                .getSerializedObject()
        else
            return {};
    }

    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setActivity(
                MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject())
                .getSerializedObject();
        else
            return {}
    }
}

type TypeOptions = "architectureConfiguration" |"architectureModelling"|"fmu"| "file"|"simulationResult"| "simulationConfiguration"| "simulationModelling" | "simulationConfigurationCreation"|"simulation" | "multiModelConfiguration";
type ActivityTypeOptions = "architectureConfigurationCreation"|
        "architectureModelling"|
        "codeGeneration"|
        "configurationCreation"|
        "designNoteCreation"|
        "dse"|
        "dseAnalysisCreation"|
        "dseConfigurationCreation"|
        "fmuExport"|
        "fmuExportForHiL"|
        "modelDescriptionExport"|
        "modelChecking"|
        "modelDescriptionImport"|
        "requirementsManagement"|
        "simulation"|
        "simulationConfigurationCreation"|
        "simulationModelling"|
        "testCreation"|
		    "defineTestModel"|
		    "defineTestObjectives"|
		    "runTest"|
		    "defineMCModel"|
		    "defineCTAbstraction"|
		    "defineMCQuery"|
		    "runMCQuery";
export class EntityFile implements Entity {
    //rdf
    //required
    private about: string;

    // required
    public type: TypeOptions;
    // required
    public hash: string;
    // required
    public path: string;
    // optional
    public commit: string;
    // optional
    public url: string;

    //prov
    // required referring to an agent
    public wasAttributedTo: EntityAgent = new EntityAgent();
    // optional referring to an activity
    public wasGeneratedBy: Activity;
    // optional referring to an earlier version if one exists
    public wasDerivedFrom: Array<EntityFile> = new Array<EntityFile>();

    public calcAbout() {
        this.about = `Entity.${this.type}:${this.path}#${this.hash}`;
    }

    public setPropertiesCalcAbout(config: EntityFileConfig) {
        if (config.type)
            this.type = config.type;
        if (config.hash)
            this.hash = config.hash;
        if (config.path)
            this.path = config.path;
        if (config.commit)
            this.commit = config.commit;
        if (config.url)
            this.url = config.url;
        if (config.path)
            this.path = config.path;
        if (config.wasAttributedTo)
            this.wasAttributedTo = config.wasAttributedTo;
        if (config.wasGeneratedBy)
            this.wasGeneratedBy = config.wasGeneratedBy;
        if (config.wasDerivedFrom)
            this.wasDerivedFrom = config.wasDerivedFrom;
        this.calcAbout();

    }

    private canBeSerialized() {
        if (!(this.about && this.type && this.hash && this.path && this.wasAttributedTo)) {
            console.error(`It was not possible to serialize the EntityFile. One of the following values are not allowed: about[${this.about}], type[${this.type}], hash[${this.hash}], path[${this.path}] or/and wasAttributedTo[${this.wasAttributedTo.shortSerialize()}]`)
            return false;
        }
        else
            return true;
    }

    public serialize(): any {
        if (this.canBeSerialized)
            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setType(this.type)
                .setHash(this.hash)
                .setPath(this.path)
                .setCommit(this.commit)
                .setUrl(this.url)
                .setWasAttributedTo(this.wasAttributedTo ? this.wasAttributedTo.shortSerialize() : null)
                .setWasGeneratedBy(this.wasGeneratedBy ? this.wasGeneratedBy.shortSerialize() : null)
                .setWasDerivedFrom(this.wasDerivedFrom.length > 0 ? MsgCreator.CreateMsg().setEntities(this.wasDerivedFrom.map
                ((entity) => entity.shortSerialize())).getSerializedObject() : null)
                .getSerializedObject();
        else return {}
    }
    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject()
        else return {}
    }
}

interface EntityFileConfig {
    type?: TypeOptions;
    hash?: string
    path?: string
    commit?: string
    url?: string
    wasAttributedTo?: EntityAgent
    wasGeneratedBy?: Activity
    wasDerivedFrom?: Array<EntityFile>
}


export class EntityTool implements Entity {
    //rdf
    // required
    private about: string;
    // required
    private version: string = IntoCpsApp.getInstance().app.getVersion();
    // required
    private type: string = "softwareTool";
    // required
    private name: string = "INTO-CPS-APP";


    constructor() {
        this.about = `Entity.${this.type}:${this.name}:${this.version}`;
    }

    private canBeSerialized() {
        if (!(this.version && this.type && this.name && this.about)) {
            console.error(`It was not possible to serialize the EntityTool. One of the following values are not allowed: about[${this.about}], type[${this.type}], version[${this.version}] or/and name[${this.name}]`)
            return false;
        }
        return true;
    }

    public serialize(): any {
        if (this.canBeSerialized())

            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setVersion(this.version)
                .setType(this.type)
                .setName(this.name).getSerializedObject();
        else return {}
    }

    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject();
        else return {}
    }
}

export class EntityAgent implements Entity {
    //rdf
    private about: string;

    // required
    public name: string;
    // optional
    public email: string;

    constructor() {
        var agent = GitConn.GitCommands.getUserData();
        this.name = agent.username;
        if(!agent.email) 
            console.error("It was not possible to create the agent for traceability, as no email is configured.")
        else {
            this.email = agent.email.length > 0 ? agent.email : null;
        this.about = `Agent:${this.email}`;
        }
    }

    public getAbout() { return this.about; }

    private canBeSerialized() {
        if (!(this.about && this.email)) {
            console.error(`It was not possible to serialize the EntityAgent. One of the following values are not allowed: about[${this.about}], or/and name[${this.name}]`)
            return false
        }
        else { return true; }
    }

    public serialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg()
                .setAbout(this.getAbout())
                .setName(this.name)
                .setEmail(this.email)
                .getSerializedObject();
        else return {}
    }
    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAgent(MsgCreator.CreateMsg().setAbout(this.getAbout()).getSerializedObject()).getSerializedObject();
        else return {}
    }
}
