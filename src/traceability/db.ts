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

 import * as Promise from 'bluebird';
//import Promise = require("bluebird");

var cypherQueries = require('./cypherQueries');

var neo4j = require('neo4j');
Promise.promisifyAll(neo4j);
var db:any;

export interface TraceNodeProps {
    uri: string,
    specifier: string, 
    [key: string]: string
}

export interface TraceNodeBase {
        _id: string,
        labels: string[],
        properties: TraceNodeProps
}

export interface TraceNode {
    node: TraceNodeBase
}

export interface TraceRelProps {
    name: string
}

export interface TraceRelBase {
        _id: number,
        type: string,
        properties: TraceRelProps,
        _fromId: number,
        _toId: number
}

export interface TraceRel {
    r: TraceRelBase
}

export interface TraceLink {
    s: TraceNodeBase,
    r: TraceRelBase,
    t: TraceNodeBase
}

module.exports = {

    // connects to neo4j server
    // use an url like 'http://user:passw@host'
    connect: function (url: string) {
        db = new neo4j.GraphDatabase({url: url});
    },

    // retrieves the node with uri 'uri' from neo4j
    getNodeByUri: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getNodeByUri('uri'), {uri:uri});
    },

    // test connection generates error if connection fails
    testConnection: function (): Promise<any> {
        return this.getNodeByUri("any");
    }, 

    // returns 'true' if the node with uri 'uri' exists otherwise false
    existsNode: function (uri: string): Promise<any> {
        return this.getNodeByUri(uri)
            .then(function (result: Object[]) {
                if (result.length == 0) {
                    return false;
                }
                else {
                    return true;
                }
            });
    },

    modifyNode: function (obj: TraceNode): Promise<any> {
        var modifiedProps = this.prepareProps(obj.node.properties);
        return this.sendCypherResponse(cypherQueries.modifyNode(modifiedProps, 'uri'), modifiedProps);
    },
 
    
    // stores a node with uri 'uri' in neo4j
    storeNode: function (obj: TraceNode):Promise<any> {
        var modifiedProps = this.prepareProps(obj.node.properties);
        return this.sendCypherResponse(cypherQueries.storeNode(modifiedProps, modifiedProps.specifier), modifiedProps)
    },

    sendCypherResponse: function(cypherQuery:string, cypherParams:any): Promise<any>{
        return db.cypherAsync({
            query: cypherQuery,
            params: cypherParams
        });
    },



    // retrieves all relations starting at node with uri 'uri' from neo4j
    getRelationsFrom: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getRelationsFrom('uri'), {uri:uri});
    },

    // retrieves all relations pointing to node with uri 'uri' from neo4j
    getRelationsTo: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getRelationsTo('uri'), {uri:uri});
    },

    getRelation: function (srcUri: string, relation: string, trgUri: string): Promise<any> {
        var params:Object = {
                src_uri: srcUri,
                rel: relation,
                trg_uri: trgUri,
            };
        return this.sendCypherResponse(cypherQueries.getRelation('src_uri', 'rel', 'trg_uri'), params);
    },

    // returns true if a (a:Entity {uri:srcUri})-[r:Trace {name:relation}]->(b:Entity {uri:trgUri}) relation exists otherwise false 
    existsRelation: function (srcUri: string, relation: string, trgUri: string): Promise<any> {
        return this.getRelation(srcUri, relation, trgUri)
            .then(function (result: Object[]) {
                if (result.length == 0) {
                    return false;
                }
                else {
                    return true;
                }
            });
    },

    // creates a (a:Entity {uri:srcUri})-[r:Trace {name:relation}]->(b:Entity {uri:trgUri}) relation
    createRelation: function (srcUri: string, relation: string, trgUri: string):Promise<any> {
        var params:Object = {
                srcUriLocal: srcUri,
                rel: relation,
                trgUriLocal: trgUri, 
            };
        return this.sendCypherResponse(cypherQueries.createRelation('srcUriLocal', 'rel', 'trgUriLocal'), params);
    },

    getNodeByParams: function(params:Object):Promise<any>{
        var modifiedparams = this.preparePropsNoKeyStrings(params);
        return this.sendCypherResponse(cypherQueries.getNodeByParams(modifiedparams), modifiedparams).then((
            function(results:any){
                return this.deleteKeyStrings(results);
        }).bind(this)
        );
    },

    deleteKeyStrings: function(TrNodes:Array<TraceNode>):Array<TraceNode>{
        TrNodes.forEach((function(item:TraceNode, index:number) {
            TrNodes[index] = this.deleteKeyString(item);
        }).bind(this));
        return TrNodes;
    },

  deleteKeyString: function(TrNode:TraceNode):any{
    var newNode:TraceNode = TrNode;
    for (var key in TrNode.node.properties){
        if (!key.match(".*" + this.getKeyKey("") + "$")){
            newNode.node.properties[TrNode.node.properties[this.getKeyKey(key)]] = TrNode.node.properties[key];
            if (!key.match(TrNode.node.properties[this.getKeyKey(key)])){
                delete newNode.node.properties[key];
            }
        }
    }
    for (var key in newNode.node.properties){
      if (key.match(".*" + this.getKeyKey("") + "$")){
        delete newNode.node.properties[key];
      }
    }
    return newNode;
  },

    prepareProps: function(props:any):any{
        var newProps:any = {};
        for(var key in props){
            newProps[this.getKeyOfProperty(key)] = props[key];
            newProps[this.getKeyKey(key)] = key;
        }
        return newProps;
    },
    preparePropsNoKeyStrings:function(props:string):string{
        var newProps:any = this.prepareProps(props);
        for(var key in newProps){
            if(key.match(".*" + this.getKeyKey("") + "$")){
                delete newProps[key];
            }
        }
        return newProps;    
    },
    getKeyOfProperty: function(key:string):string{
        var keyNoSpecialChar:string;
        if (key.match("rdf:about")){
            keyNoSpecialChar = "uri";
        }else{
            keyNoSpecialChar = key.replace(/[^a-zA-Z_]/g, "");
        }
        return keyNoSpecialChar;
    },
    getKeyKey:function(key:string):string{
        return  this.getKeyOfProperty(key)+"__KeyString";
    }
};
