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

module.exports = {

    getNodeByParams: function (nodeParams: Object):string{
        return 'MATCH (node {' + getPropertyString(nodeParams) + '}) RETURN node';
    },
    createRelation: function (scrUriName:string, relationName:string, trgUriName:string):string{
        return 'MATCH (s {uri: {' + scrUriName + '}}),(t {uri: {' + trgUriName + '}}) \
        CREATE (s)-[r:Trace {name: {' + relationName + '}}]->(t) \
        RETURN s,r,t';
    },
    getRelation:function (scrUriName:string, relationName:string, trgUriName:string):string{
        return 'MATCH (s {uri: {' + scrUriName + '}})-[r:Trace {name: {' + relationName + '}}]->(t {uri: {' + trgUriName + '}}) RETURN r';
    },
    getRelationsTo:function (uriName:string):string{
        return 'MATCH (s)-[r:Trace]->(t {uri: {' + uriName + '}}) RETURN s,r,t';
    },
    getRelationsFrom:function (uriName:string):string{
        return 'MATCH (s {uri: {' + uriName + '}})-[r:Trace]->(t) RETURN s,r,t';
    },
    storeNode:function(properties:Object, specifier:string){
        return 'CREATE (node:' + specifier + ' {' + getPropertyString(properties) + '}) RETURN node';
    },
    getNodeByUri:function(uriName:string):string{
        return 'MATCH (node {uri: {' + uriName + '}}) RETURN node';
    },
    modifyNode:function(properties:Object, uriName:string):string{
        var queryString:string = 'MERGE (n {uri: {' + uriName + '}}) ON MATCH SET ';
        for (var key in properties){
            queryString = queryString +  'n.' + key + '= {' + key + '}, ';
        }
        return queryString.substring(0, queryString.length - 2);
    }
}

function getPropertyString(params:Object):string{
    var propertyString = '';
    for (var key in params){
        propertyString = propertyString +  key + ': {' + key + '}, ';
    }
    return propertyString.substring(0, propertyString.length - 2);
}
