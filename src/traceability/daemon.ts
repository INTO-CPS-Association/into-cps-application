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


// for REST services
import Express = require('express');
// concurrency
import * as Promise from 'bluebird';
// import * as http from "http";

// xml handling
import * as xml2js from 'xml2js';
import * as jsonschema from 'jsonschema';

import Path = require("path");
var fs = require('fs');
import * as GitConn from "./git-connection"

/**
 * Trace
 */
class Trace {
    constructor(source: TraceNode, relation: string, target: TraceNode) {
        this.source = source;
        this.relation = relation;
        this.target = target;
    }
    source: TraceNode;
    relation: string;
    target: TraceNode;
}

import { TraceNode, TraceNodeBase, TraceRel, TraceRelProps, TraceLink } from './db';


export class Daemon {
    public isconnected: boolean;
    private db: any;
    public port: number;
    private neo4jURL: string;
    private enableValidation: boolean;
    private DBfileLocation: string;
    public isRunning = false;

    private schemas: Map<string, Object> = new Map<string, Object>();

    constructor() {
        this.db = require('./db');
        this.isconnected = false;
        this.enableValidation = true;
        this.loadValidationSchemas();
    }

    //load validation schemas
    private loadValidationSchemas() {
        let schemaBase = Path.join(__dirname, "..", "resources", "into-cps", "tracability", "schemas");

        fs.readdir(schemaBase, (err: any, files: any) => {
            files.forEach((file: string) => {
                if (!file.startsWith(".") && file.endsWith(".json")) {
                    let path = Path.join(schemaBase, file);
                    if (fs.existsSync(path)) {

                        fs.readFile(path, "utf8", (err: any, data: any) => {
                            if (err) {
                                console.log("Unable to find JsonSchema at " + file);
                            } else {
                                try {
                                    let schema = JSON.parse(data);

                                    if (schema == null || Object.keys(schema).indexOf("version") < 0) {
                                        console.error("Malformed schema: " + file + ". It will be ignored.")
                                    }

                                    let version = schema["version"];
                                    console.info("Adding tracability schema version: " + version + " from: " + file);
                                    this.schemas.set(version, schema);

                                } catch (e) {
                                    console.error("Malformed schema: " + file + ". The schema file does not contain valid JSON.")
                                }
                            }
                        });
                    }
                }
            });
        });
    }

    //start daemon, listening on the given port
    public start(serverPort: number): Promise<number> {

        return new Promise<number>((resolve, reject) => {
            try {
                var app = Express();
                app.locals.title = 'INTO-CPS-Traceability-Daemon';
                var bodyParser = require('body-parser');

                app.use(bodyParser.json({ limit: '50mb' }));
                //server.use(restify.queryParser({ mapParams: false }));

                // ------- REST URLs: --------
                app.post('/traces/push/json', (req, res)=>this.handlePostJSON(req,res));
                app.get('/traces/from/:source/json', (this.handleGETTraceFromJSON).bind(this));
                app.get('/traces/to/:target/json', (this.handleGETTraceToJSON).bind(this));
                app.get('/nodes/json', (this.handleGETNodeToJSON).bind(this));

                app.post('/traces/push/xml', (this.handlePostXML).bind(this));
                app.get('/traces/from/:source/xml', (this.handleGETTraceFromXML).bind(this));
                app.get('/traces/to/:target/xml', (this.handleGETTraceToXML).bind(this));

                app.get('/database/cypher/:query/json', (this.handleCypherQuery).bind(this));

                //  server.get('/traces/test/methods', handleTestMethods);

                app.get(new RegExp('^\/test\/(.+)\/json'), (this.handleMatch).bind(this));

                // development error handler
                // will print stacktrace
                if (app.get('env') === 'development') {
                    app.use(function (err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) {
                        res.status(err.code || 500)
                            .json({
                                status: 'error',
                                message: err
                            });
                    });
                }
                else {
                    // production error handler
                    // no stacktraces leaked to user
                    app.use(function (err: any, req: Express.Request, res: Express.Response, next: Express.NextFunction) {
                        res.status(err.status || 500)
                            .json({
                                status: 'error',
                                message: err.message
                            });
                    });
                }


                var server = app.listen(serverPort, (err: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('Traceability daemon listening on port %s.', server.address().port);
                    this.port = server.address().port;
                    this.isRunning = true;
                    resolve(server.address().port);
                });
            } catch (err) {
                reject(err);
            }
        });
    }


    //connect to neo4j database server
    public connect(neo4jURL: string, retries: number): Promise<boolean> {
        if (!neo4jURL) {
            neo4jURL = this.neo4jURL;
        }
        this.neo4jURL = neo4jURL;

        return new Promise<boolean>((resolve, reject) => {

            try {
                //connect to database object
                this.db.connect(neo4jURL);
            } catch (err) {
                console.log(err.message);
                console.log(err.stack);
                this.isconnected = false;
            }

            var counter = retries;

            let connectRetry = () => {
                counter--;
                this.db.testConnection().then(() => {
                    console.info("Connected to NEO4J")
                    this.isconnected = true;
                    resolve(this.isconnected);
                }).catch((e: any) => {
                    if (counter <= 0) {
                        console.info("NOT connected to NEO4J aborting...")
                        reject(e);
                    } else {
                        console.info("NOT connected yet retrying: " + retries + " / " + counter);
                        setTimeout(connectRetry, 1000);
                    }
                })
            };

            setTimeout(connectRetry, 1000);
        });
    }

    // ------- functions ---------

    private sendUnconnectedMessage(resp: Express.Response) {
        resp.status(503).send("Unable to perform action. Daemon is not connected to neo4J.");
    }

    public sendCypherResponse(cypherQuery: string, cypherParams: any) {
        return this.db.sendCypherResponse(cypherQuery, cypherParams);
    }

    private handleCypherQuery(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("Cypher request received:");
        var cypherQuery: string = req.params.query;
        var cypherParams = req.query;
        this.sendCypherResponse(cypherQuery, cypherParams)
            .then(function (results: any) {
                resp.status(200)
                    .json({
                        status: 'success',
                        data: results,
                        message: 'Retrieved cypher response'
                    });
            })
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handleMatch(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        resp.status(200)
            .json({
                status: 'success',
                message: req.params[0] + " matched!"
            });
    }

    private handleGETTraceFromJSON(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("GET request received:");
        this.db.getRelationsFrom(req.params.source)
            .then((function (results: TraceLink[]) {
                resp.send(this.toRdfJson(this.toTriples(results)));
            }).bind(this))
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handleGETTraceFromXML(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("GET request received:");
        this.db.getRelationsFrom(req.params.source)
            .then((function (results: TraceLink[]) {
                resp.send(this.toRdfXml(this.toTriples(results)));
            }).bind(this))
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handleGETTraceToJSON(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("GET request received:");
        this.db.getRelationsTo(req.params.target)
            .then((function (results: TraceLink[]) {
                resp.send(this.toRdfJson(this.toTriples(results)));
            }).bind(this))
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handleGETNodeToJSON(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("GET request received:");
        this.db.getNodeByParams(req.query)
            .then((function (results: any) {
                resp.send(results);
            }).bind(this))
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handleGETTraceToXML(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return next();
        }
        console.log("GET request received:");
        this.db.getRelationsTo(req.params.target)
            .then((function (results: TraceLink[]) {
                resp.send(this.toRdfXml(this.toTriples(results)));
            }).bind(this))
            .catch(function (err: any) {
                return next(err);
            });
    }

    private handlePostJSON(req: Express.Request, resp: Express.Response) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
            return ;
        }
        console.log("POST request received:");
        if (req.is('application/json')) {
            console.log("The content type is 'application/json'");
            var jsonObj = req.body;
            this.storeObject(jsonObj)
                .then(function (status: any) {
                    if (status) {
                        if (status.errors) {
                            if (status.errors.length != 0) {
                                resp.status(400).json({
                                    status: 'validation error',
                                    message: status
                                });
                                return ;
                            }
                        }
                    }
                    resp.status(200).json({
                        status: 'success',
                        message: 'JSON object stored'
                    });
                    return ;
                })
                .catch(function (err) {
                    console.log("handlePostJSON catch: "+err);
                    
                    resp.status(500).json({
                        status: 'error',
                        message: err
                    });
                    return ;
                });
        }
        else {
            resp.status(400).send("Invalid JSON data.");
        }
    }

    private handlePostXML(req: Express.Request, resp: Express.Response, next: Express.NextFunction) {
        if (!this.isconnected) {
            this.sendUnconnectedMessage(resp);
        }
        console.log("POST request received:");
        try {
            this.toJson(req.body, (function cb(err: Error, obj: Object) {
                if (err) throw err;
                this.storeObject(obj, resp)
                    .catch(function (err: any) {
                        return next(err);
                    });
            }).bind(this));
        } catch (err) {
            return next(err);
        }
    }

    private reformat(old: any) {
        var newObj: any = {};
        var tmp: any = old["prov:Entity"];
        newObj["rdf:about"] = tmp.$["rdf:about"];
        delete tmp.$;
        for (var field in tmp) {
            newObj[field] = tmp[field];
        }
        return newObj;
    }


    // stores the data object
    private storeObject(jsonObj: Object): Promise<any> {
        return this.recordTrace(jsonObj);
    }

    private validateJsonInput(jsonObj: any): jsonschema.ValidatorResult {
        let ctxt: any = { schema: "", options: "", propertyPath: "", base: "", schemas: "" };

        let rdfKey = "rdf:RDF";
        let schemaVersionKey = "messageFormatVersion";
        if (jsonObj == null || Object.keys(jsonObj).indexOf(rdfKey) < 0 || Object.keys(jsonObj[rdfKey]).indexOf(schemaVersionKey) < 0) {
            var validationResult: jsonschema.ValidatorResult = new jsonschema.ValidatorResult("", null, {}, ctxt);
            validationResult.addError("invalid json can not find schema version");
            return validationResult;
        }
        let schemaVersion: string = <string>jsonObj[rdfKey][schemaVersionKey];

        if (this.schemas.has(schemaVersion)) {
            let schema = this.schemas.get(schemaVersion);
            if (schema != null) {
                console.info("Validating json message with schema: " + schemaVersion);
                validationResult = jsonschema.validate(jsonObj, schema);
                return validationResult;
            }
        }

        var validationResult: jsonschema.ValidatorResult = new jsonschema.ValidatorResult("", null, {}, ctxt);
        validationResult.addError("unable to obtain the specified schema: " + schemaVersion);
        return validationResult;
    }

    private readJsonSchema(path: string): Object {
        if (fs.existsSync(path)) {
            var schemaString: string = fs.readFileSync(path);

            //this.enableValidation = true;
            console.log("Validation of traceability messages enabled. Now validating against file " + Path.basename(path) + ".");
            return JSON.parse(schemaString);
        } else {
            console.log("Unable to find JsonSchema at " + path + ". Validation is disabled.")
        }
        return null;
    }

    public recordTrace(jsonObj: Object): Promise<any> {
        return this.recordTraceNoFile(jsonObj).then((data) =>this.storeMessageFile( jsonObj));
    }

    public recordTraceNoFile(jsonObj: Object): Promise<any> {

        return new Promise<void>((resolve, reject) => {

            var validationResult = this.validateJsonInput(jsonObj);
            //var pr: Promise<any> = Promise.resolve(undefined);
            if (validationResult.errors.length != 0) {
                console.log("Recieved message is not valid according to the JsonSchema and will not be recorded. JsonSchema was read from: ");
                //console.log(this.jsonSchemaPath);
                console.log("Validation Errrors are:");
                console.log(validationResult);
                reject(validationResult);
                return;
            }
            var objArray: Object[];
            if (!Array.isArray(jsonObj)) {
                objArray = [jsonObj];
            }
            else {
                objArray = jsonObj;
            }
            for (var index in objArray) {
                var obj: any = objArray[index];
                if ((<Object>obj).hasOwnProperty("$")) {
                    // if data comes from xml parser the object needs to be reformatted
                    obj = this.reformat(obj);
                }

                //add to database
                this.parseSubject(obj, "");
            }
            resolve();
        });
    }
    public setDBfileLocation(location: string) {
        this.DBfileLocation = location;
    }
    private storeMessageFile(messageObject: Object) {
        var messageString = JSON.stringify(messageObject);
        var fileName: string = Path.join(this.DBfileLocation, GitConn.GitCommands.getHashOfFile(messageString, true) + '.dmsg');
        console.info("Recording trace: " + fileName);
        fs.writeFileSync(fileName, messageString, { flag: 'w' });
        GitConn.GitCommands.addFile(fileName);
    }

    private isNode(obj: any) {
        for (var key in obj) {
            var value = obj[key];
            if (typeof value === "string") {
                if (key === "rdf:about") {
                    return true;
                }
            }
        }
        return false;
    }


    private getNode(obj: any, specifier: string): TraceNode {
        var targetObj: TraceNode = {
            node: {
                properties: {
                    uri: obj["rdf:about"],
                    specifier: specifier,
                },
                labels: new Array(0),
                _id: ""
            }
        }
        for (var key in obj) {
            if (typeof obj[key] === "string") {
                if (!(key === "rdf:about")) {
                    targetObj.node.properties[key] = obj[key];
                }
            }
        }
        return targetObj;
    }
    private isRelation(relation: any) {
        return !this.isString(relation);
    }
    private isString(jsonObj: any) {
        if (typeof jsonObj === "string") {
            return true;
        }
        return false;
    }

    private isArray(array: any) {
        if (array.constructor == Array) {
            return true;
        }
        return false;
    }
    private storeNode(node: TraceNode): Promise<any> {
        return this.db.existsNode(node.node.properties.uri)
            .then((function (existsNode: boolean) {
                if (!existsNode) {
                    return this.db.storeNode(node);
                } else {
                    return this.db.modifyNode(node);
                }
            }).bind(this));
    }

    private parseSubject(jsonObj: any, type: string): Promise<any> {
        var pr: Promise<any> = Promise.resolve(undefined);
        if (this.isNode(jsonObj)) {
            var subject = this.getNode(jsonObj, type);
            pr = this.storeNode(subject);
            for (var key in jsonObj) {
                pr = pr.return(key).then((function (localKey: any) { return this.parseRelation(subject, jsonObj[localKey], localKey) }).bind(this));
            }
        } else if (this.isArray(jsonObj)) {
            for (let value of jsonObj) {
                pr = pr.return(value).then((function (localValue: any) { return this.parseSubject(localValue, type) }).bind(this));
            }
        } else if (!this.isString(jsonObj)) {
            for (var key in jsonObj) {
                pr = pr.return(key).then((function (localKey: string) {
                    return this.parseSubject(jsonObj[localKey], localKey);
                }).bind(this));
            }
        }
        return pr;
    }

    private parseRelation(subject: TraceNode, jsonObj: any, type: string): Promise<any> {
        var pr: Promise<any> = Promise.resolve(undefined);
        if (this.isArray(jsonObj)) {
            for (let arrayValue of jsonObj) {
                pr = pr.return(arrayValue).then((function (localValue: any) { return this.parseRelation(subject, localValue, type) }).bind(this));
            }
        } else {
            for (var key in jsonObj) {
                if (this.isNode(jsonObj[key]) || this.isArray(jsonObj[key])) {
                    pr = pr.return(key).then((function (localKey: any) { return this.parseObject(subject, type, jsonObj[localKey], localKey) }).bind(this));
                }
            }
        }
        return pr;
    }
    private parseObject(subject: TraceNode, relation: string, jsonObj: any, type: string): Promise<any> {
        var pr: Promise<any> = Promise.resolve(undefined);
        if (this.isNode(jsonObj)) {
            var object: TraceNode = this.getNode(jsonObj, type);
            pr = this.parseSubject(jsonObj, type);
            pr = pr.then((function () { return this.storeSingleObject(subject, relation, object) }).bind(this));
        } else if (this.isArray(jsonObj)) {
            for (let arrayValue of jsonObj) {
                pr = pr.return(arrayValue).then((function (localValue: any) { return this.parseObject(subject, relation, localValue, type) }).bind(this));
            }
        }
        return pr;
    }


    private storeSingleObject(sub: TraceNode, pred: string, obj: TraceNode): Promise<any> {
        return this.storeTriple(new Trace(sub, pred, obj));
    }

    //function storeTriple(triple: Trace, resp: Express.Response) {
    private storeTriple(triple: Trace): Promise<any> {
        return this.storeNode(triple.source)
            // insert target node if not yet contained
            .then((function () { return this.storeNode(triple.target) }).bind(this))
            // insert relation if not yet contained
            .then((function () {
                return this.db.existsRelation(triple.source.node.properties.uri, triple.relation, triple.target.node.properties.uri)
                    .then((function (relationExists: boolean) {
                        if (!relationExists) {
                            return this.db.createRelation(triple.source.node.properties.uri, triple.relation, triple.target.node.properties.uri);
                        } else {
                            return Promise.resolve(undefined);
                        }
                    }).bind(this));
            }).bind(this));
    }

    // returns an error reporting function 
    private reportError(resp: Express.Response, error: number) {
        return function (err: Error) {
            console.log(err.message);
            console.log(err.stack);
            resp.status(error).write(err.message);
        }
    }

    // generates array of Trace objects from TraceLink array
    private toTriples(answer: TraceLink[]) {
        var triples: Trace[] = [];
        for (let trace of answer) {
            var triple: Trace = new Trace({ node: trace.s }, trace.r.properties.name, { node: trace.t });
            triples.push(triple);
        }
        return triples;
    }

    // translates array of Trace objects to an RDF/JSON object
    private toRdfJson(triples: Trace[]) {
        var rdfObjects: Object[] = [];
        for (let triple of triples) {
            rdfObjects.push(this.toObject(triple));
        }
        return rdfObjects;
    }
    private toObject(triple: Trace): Object {
        var targetSpecifier: string = triple.target.node.properties.specifier;
        var sourceSpecifier: string = triple.source.node.properties.specifier;
        delete triple.source.node.properties.specifier;
        delete triple.target.node.properties.specifier;
        var obj: { "rdf:RDF": any } = {
            "rdf:RDF": {
                "prov": "http://www.w3.org/ns/prov#",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                [sourceSpecifier]: {
                    "rdf:about": triple.source.node.properties.uri,
                    [triple.relation]: {
                        [targetSpecifier]: {
                            "rdf:about": triple.target.node.properties.uri
                        }
                    }
                }
            }
        };
        delete triple.source.node.properties.uri;
        delete triple.target.node.properties.uri;
        for (var key in triple.source.node.properties) {
            if (!key.match(".*" + this.db.getKeyKey("") + "$")) {
                obj["rdf:RDF"][sourceSpecifier][this.db.getKeyKey(key)] = triple.source.node.properties[key];
            }
        }
        for (var key in triple.target.node.properties) {
            if (!key.match(".*" + this.db.getKeyKey("") + "$")) {
                obj["rdf:RDF"][sourceSpecifier][triple.relation][targetSpecifier][this.db.getKeyKey(key)] = triple.target.node.properties[key];
            }
        }
        return obj;
    }

    // translates array of Trace objects to an RDF/XML object
    private toRdfXml(triples: Trace[]) {
        var rdfObjects: Object[] = [];
        var builder = new xml2js.Builder({ headless: true });
        for (let triple of triples) {
            rdfObjects.push(builder.buildObject(this.toObject(triple)));
        }
        return rdfObjects;
    }

    private toJson(xml: string, cb: Function) {
        var parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false });
        parser.parseString(xml, cb);

    }
}
