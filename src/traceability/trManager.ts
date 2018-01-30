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

import childProcess = require("child_process");
import { SettingKeys } from "../settings/SettingKeys";
import { Project } from "../proj/Project"
import { Daemon } from "../traceability/daemon"

var fsFinder = require("fs-finder");
var fs = require("fs");
import Path = require("path");

class Neo4JHelper {

    //returns the found path or null
    public static searchForNeo4jHome(searchPath: string): string {
        var fileString: string;
        if (process.platform == 'darwin' || process.platform == 'linux') {
            fileString = "bin" + Path.sep + "<[nN]><[eE]><[oO]>4<[jJ]>";
        } else {
            fileString = "bin" + Path.sep + "<[nN]><[eE]><[oO]>4<[jJ]>*";
        }

        var found = false;
        if (fs.existsSync(searchPath)) {
            var files: Array<string> = fsFinder.from(searchPath).findFiles(fileString);
            if (files.length > 0) {
                return Path.normalize(Path.dirname(files[0]) + Path.sep + "..");
            }
        }

        return null;
    }


    public static getBinPath(homePath: string): string {
        return Path.join(homePath, "bin");
    }


    public static stopNeo4J(pid: number): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            if (pid == undefined || pid == null) {
                resolve();
                return;
            }

            var kill = require('tree-kill');
            if (require('is-running')(pid)) {
                kill(pid, 'SIGKILL',  (err: any) => {
                    if (err) {
                        reject("Failed to close Neo4J. " + "It was not possible to close Neo4J. Pid: " + pid);
                    }
                    else {
                        resolve();
                    }

                });
            } else
                resolve();
        });
    }

}


class Neo4Jconfiguration {

    username: string;
    password: string;
    port: string;

    constructor() {
        this.username = "intoCPSApp";
        this.password = "KLHJiK8k2378HKsg823jKKLJ89sjklJHBNf8j8JH7FxE";
        this.port = "7474";
    }
}

export class TrManager {

    private neo4jApplicationHome: string = null;
    private workdingDir: string = null;

    neo4Jconf: Neo4Jconfiguration = new Neo4Jconfiguration();
    running: boolean;
    neo4JProcess: childProcess.ChildProcess;
    daemon: Daemon = null;
    enabled: boolean = false;
    private daemonPort: number = 0;
    private dbFilesSubfoder: string = 'db';

    constructor(enabled: boolean, daemonPort: number) {
        this.enabled = enabled;
        this.running = false;
        this.daemonPort = daemonPort;
        if(this.enabled)
        {
            this.daemon = new Daemon();
        }
    }

    public getDaemonPort(): number {
        return this.daemon.port;
    }

    public sendCypherQuery(query: string, params?: any) {
        if (!params) {
            params = {};
        }
        return this.daemon.sendCypherResponse(query, params);
    }

    public recordTrace(jsonObj: Object) {
        if (!this.enabled) {
            return {};
        }
        this.daemon.recordTrace(jsonObj);
    }

    public start(neo4JConfLoc: string, appDir: string, appsDirTemp: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if (!this.enabled) {
                resolve();
                return;
            }

            var neo4jHome: string = null;
            for (let path in [appDir, appsDirTemp]) {
                neo4jHome = Neo4JHelper.searchForNeo4jHome(appDir);
                if (neo4jHome != null) {
                    break;
                }
            }

            if (neo4jHome == null) {
                reject("Neo4j not found in search path: " + [appDir, appsDirTemp]);
            }

            this.neo4jApplicationHome = neo4jHome;
            this.workdingDir = neo4JConfLoc;

            this.running = true;
            return this.startNeo4J().then((p) => {
                this.neo4JProcess = p;
                if (this.enabled) {
                    this.daemon.setDBfileLocation(this.getDBfileLocation());
                    let neo4jURL: string = "http://" + this.neo4Jconf.username + ":" + this.neo4Jconf.password + "@localhost:" + this.neo4Jconf.port;
                    return this.daemon.connect(neo4jURL, 30);
                }
            }).then((connected) => {
                if (connected) {
                    this.reBuildDataBase();
                    if (!this.daemon.isRunning) {
                        this.startDaemon();
                    }
                }
            })
        });
    }

    public changeDataBase(projectLocation: string, appDir: string, appsDirTemp: string) {
        if (!this.enabled) {
            return;
        }

        let handleError = (err: any) => {
            console.info(err);
            const { dialog } = require('electron')
            dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "Neo4J: " + err }, function (button: any) { });

        };

        var confLoc: string = Path.join(projectLocation, Project.PATH_TRACEABILITY);

        if (this.running) {
            this.stop().then(() => { return this.start(confLoc, appDir, appsDirTemp) }).then(() => {
                console.info("Startup complete.");
            }).catch(handleError);
        } else {
            this.start(confLoc, appDir, appsDirTemp).then(() => { }).catch(handleError);
        }
    }


    private startDaemon() {

        this.daemon.start(this.daemonPort).catch((err) => {
            if (err.errno === 'EADDRINUSE') {
                console.info("Daemon address: " + this.daemonPort + " already in use.")
            } else {
                console.info(err);
            }
        });
    }

    public getDBfileLocation(): string {
        return Path.join(this.workdingDir, this.dbFilesSubfoder);
    }

    private removeEmptyLinesAndComments(data: string) {
        var lines = "";
        data.split("\n").forEach(line => {
            if (line.trim().length > 0 && !line.startsWith("#"))
                lines += line + "\n";

        });
        return lines;
    }

    private toNixPathFormat(path: string) {
        return path.split(Path.sep).join("/");
    }
    private checkDataBase() {

        let CreateFolderIfNotExist = (path: string) => {
            return new Promise((resolve, reject) => {
                if (!fs.existsSync(path)) {
                    fs.mkdir(path, (err: Error) => {
                        if (err) {
                            console.log("Unable to create database folder " + path);
                            reject(err);
                        } else
                            resolve();
                    });
                } else {
                    resolve();
                }
            });
        };

        let writeDbConfig = () => {
            return new Promise((resolve, reject) => {
                var confFileName: string = Path.join(this.workdingDir, "neo4j.conf");

                let neo4jDefaultConfig = Path.join(this.neo4jApplicationHome, "conf", "neo4j.conf");

                var fileContent: string = fs.readFileSync(neo4jDefaultConfig, "UTF-8");

                //remove all text from the config string
                fileContent = this.removeEmptyLinesAndComments(fileContent)

                fileContent += "dbms.directories.data=" + this.toNixPathFormat(Path.join(this.workdingDir, "data")) + '\n';
                fileContent += 'dbms.connector.http.listen_address=:' + this.neo4Jconf.port + '\n';
                fileContent += 'dbms.directories.logs=' + this.toNixPathFormat(this.workdingDir) + ' \n';
                fileContent += 'dbms.logs.http.enabled=true' + '\n';

                fs.writeFile(Path.join(this.workdingDir, ".gitignore"), "data\n*.log\n*.conf\n");

                fs.writeFileSync(confFileName, fileContent);
                resolve();

            });
        };

        return CreateFolderIfNotExist(this.workdingDir).then(() => {
            return CreateFolderIfNotExist(this.getDBfileLocation())
        }).then(() => {
            return writeDbConfig()
        }).then(() => {
            return CreateFolderIfNotExist(Path.join(this.workdingDir, "data"))
        }).then(() => {
            return CreateFolderIfNotExist(Path.join(this.workdingDir, "data", "dbms"))
        }).then(() => {
            fs.writeFileSync(Path.join(this.workdingDir, "data", "dbms", "auth"), "intoCPSApp:SHA-256,9780635B5BC9974CCB47A230B20DEF8069A26E2B3EC954A76E4034B9308042B0,2ADAC311B595F9670EBA0424F5620BED:", { flag: 'w' });
        });
    }
    private clearDataBase() {
        this.sendCypherQuery('MATCH (n) DETACH DELETE n');
        return;
    }
    private buildDataBase(dataFolder: string) {
        fs.readdir(dataFolder, (err: any, files: any) => {
            files.forEach((file: string) => {
                if (!file.startsWith(".") && file.endsWith(".dmsg"))

                    this.loadMessageFileToDB(file);
            });
        });
        return;
    }
    private loadMessageFileToDB(file: string) {

        fs.readFile(Path.join(this.getDBfileLocation(), file), 'utf8', (err: Error, data: string) => {
            console.info("Tracebility processing: " + file);
            this.daemon.recordTraceNoFile(JSON.parse(data))
        });
    }
    private reBuildDataBase() {
        this.clearDataBase();
        this.buildDataBase(this.getDBfileLocation());
        return;
    }

    private spawnNeo4JProcess(): Promise<childProcess.ChildProcess> {

        return new Promise((resolve, reject) => {
            try {

                var spawn = require("child_process").spawn;
                var neo4JExecOptions: Object = {
                    env: Object.assign(process.env,
                        {
                            "NEO4J_BIN": Neo4JHelper.getBinPath(this.neo4jApplicationHome),
                            "NEO4J_HOME": this.neo4jApplicationHome,
                            "NEO4J_CONF": this.workdingDir,
                        }),
                    detached: false,
                    shell: true,
                    cwd: Neo4JHelper.getBinPath(this.neo4jApplicationHome)
                };
                let argv: string[] = [];
                if (process.platform == "linux")
                    argv.push("/bin/bash");
                if (process.platform == "win32") {
                    argv.push("neo4j");
                } else {
                    argv.push(Path.join(Neo4JHelper.getBinPath(this.neo4jApplicationHome), "neo4j"));
                }
                argv.push("console");
                console.log("Starting Neo4J from path '" + Neo4JHelper.getBinPath(this.neo4jApplicationHome) + "'. With database configuration: " + this.workdingDir);
                var localNeo4JProcess: childProcess.ChildProcess = spawn(argv[0], argv.splice(1), neo4JExecOptions);

                localNeo4JProcess.stdout.on('data', function (data: any) {
                    console.info('neo4j (stdout): ' + data);
                });
                localNeo4JProcess.stderr.on('data', function (data: any) {
                    console.error('neo4j (stdout): ' + data);
                });
                resolve(localNeo4JProcess);
            } catch (err) {
                this.running = false;
                console.log("Unable to start Neo4J due to error: " + err.message);
                console.log(err.stack);
                reject(err);
            }
        });
    }
    private startNeo4J(): Promise<childProcess.ChildProcess> {

        return this.checkDataBase().then(() => {
            return this.spawnNeo4JProcess()
        });
    }



    //stop the traca manager and the database process
    public stop(): Promise<void> {

        return new Promise<void>((resolve, reject) => {

            if (!this.enabled || !this.running) {
                resolve();
                return;
            }

            if (this.running) {
                if (this.neo4JProcess == null || this.neo4JProcess == undefined) {
                    this.running = false;
                    resolve();
                    return;
                }
                Neo4JHelper.stopNeo4J(this.neo4JProcess.pid).then(() => {
                    this.neo4JProcess = null;
                    this.running = false;
                    resolve();
                }).catch((e) => reject(e));
            } else
                resolve();

        });
    }
}
