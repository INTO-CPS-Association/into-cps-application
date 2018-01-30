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

import { ViewController } from "../iViewController";
import { IntoCpsApp } from "../IntoCpsApp";
import Path = require("path");
import { RTTester } from "../rttester/RTTester";
import fs = require("fs");
import * as RTesterModalCommandWindow from "./GenericModalCommand";
import { IntoCpsAppMenuHandler } from "../IntoCpsAppMenuHandler";


export class LTLEditorController extends ViewController {

    menuHandler: IntoCpsAppMenuHandler;
    ltlQueryFileName: string;
    ltlEditor: any;
    hBMCSteps: HTMLInputElement;
    hRequirements: HTMLInputElement;
    hVerifiesButton: HTMLButtonElement;
    hViolatesButton: HTMLButtonElement;

    constructor(protected viewDiv: HTMLDivElement, menuHandler: IntoCpsAppMenuHandler, folderName: string) {
        super(viewDiv);
        this.menuHandler = menuHandler;
        this.ltlQueryFileName = Path.join(folderName, "query.json");
        IntoCpsApp.setTopName("LTL Formula");
        this.hBMCSteps = <HTMLInputElement>document.getElementById("BMCSteps");
        this.hRequirements = <HTMLInputElement>document.getElementById("Requirements");
        this.hVerifiesButton = <HTMLButtonElement>document.getElementById("verifies");
        this.hViolatesButton = <HTMLButtonElement>document.getElementById("violates");
        this.ltlEditor = ace.edit("ltlFormula");
        this.ltlEditor.$blockScrolling = Infinity;
        let langTools: any = ace.require("ace/ext/language_tools");
        this.configureCompleter(langTools);
        this.load();
        document.getElementById("save").addEventListener("click", () => this.save());
        document.getElementById("check").addEventListener("click", () => this.check());
    }

    load() {
        let data = fs.readFileSync(this.ltlQueryFileName, "utf-8");
        let json = JSON.parse(data);
        this.ltlEditor.setValue(json["ltlFormula"]);
        this.hBMCSteps.value = json["BMCSteps"];
        this.hRequirements.value = json["RequirementsToLink"].join(", ");
        if (json["TracabilityLink"] == "verifies") {
            (<any>this.hViolatesButton).checked = false;
            this.hViolatesButton.parentElement.classList.remove("active");
            (<any>this.hVerifiesButton).checked = true;
            this.hVerifiesButton.parentElement.classList.add("active");
        } else {
            (<any>this.hVerifiesButton).checked = false;
            this.hVerifiesButton.parentElement.classList.remove("active");
            (<any>this.hViolatesButton).checked = true;
            this.hViolatesButton.parentElement.classList.add("active");
        }
    }

    getRequirements() {
        return this.hRequirements.value.split(',').reduce(
            (a: string[], r: string) => {
                let req = r.trim();
                if (req != "")
                    a.push(req);
                return a;
            }, []);
    }

    getTracabilityLink() {
        return (<any>this.hVerifiesButton).checked ? "verifies" : "violates";
    }

    save() {
        let json = {
            ltlFormula: this.ltlEditor.getValue(),
            BMCSteps: this.hBMCSteps.value,
            RequirementsToLink: this.getRequirements(),
            TracabilityLink: this.getTracabilityLink(),
        };
        fs.writeFileSync(this.ltlQueryFileName, JSON.stringify(json, null, 4));
    }

    check() {
        let self = this;
        this.save();
        let projectPath = RTTester.getProjectOfFile(this.ltlQueryFileName);
        let queryDir = Path.dirname(this.ltlQueryFileName);
        let queryName = Path.basename(queryDir);
        let modelCheckingReportPath = Path.join(queryDir, "model-checking-report.html");
        let modelCheckingReportPathJSON = Path.join(queryDir, ".model-checking-report.json");
        let modelCheckingReportTitle = RTTester.getRelativePathInProject(modelCheckingReportPath);
        let cmd = {
            title: "Check LTL Query",
            command: RTTester.pythonExecutable(),
            arguments: [
                Path.normalize(Path.join(RTTester.rttMBTInstallDir(), "bin", "rtt-mbt-mc.py")),
                queryName],
            options: {
                env: RTTester.genericCommandEnv(this.ltlQueryFileName),
                cwd: queryDir
            },
            onSuccess: () => {
                let rawVerdict = fs.readFileSync(Path.join(queryDir, "verdict.txt"));
                let verdict: string = null;
                if (rawVerdict.includes("holds")) {
                    verdict = "holds";
                } else if (rawVerdict.includes("violated")) {
                    verdict = "does-not-hold";
                } else {
                    verdict = "unknown";
                }
                let jsonReport = {
                    verdict: verdict,
                    BMCSteps: this.hBMCSteps.value,
                    requirements: this.getRequirements(),
                    traceabilityLink: this.getTracabilityLink(),
                };
                fs.writeFileSync(modelCheckingReportPathJSON, JSON.stringify(jsonReport, null, 4));
                self.menuHandler.openMCResult(modelCheckingReportPath)
            }
        };
        RTesterModalCommandWindow.runCommand(cmd);
    }

    configureCompleter(langTools: any) {
        let fs = require("fs");
        let SQL = require("sql.js");
        let dbFile = Path.join(RTTester.getProjectOfFile(this.ltlQueryFileName), "model", "model_dump.db");
        fs.readFile(dbFile, (err: any, filebuffer: any) => {
            if (err) throw err;
            let db = new SQL.Database(filebuffer);
            let stmt = db.prepare("SELECT * FROM Symbols WHERE FullName LIKE :pat");
            let completer: any = {
                identifierRegexps: [/[a-zA-Z_0-9\.]/],
                getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
                    if (prefix.length === 0) { callback(null, []); return; }
                    let completions: any = [];

                    // Completions for some builtins symbols
                    let builtinSymbols: { [key: string]: string; } = {
                        "false": "constant",
                        "true": "constant",
                        "_timeTick": "time",
                        "_stable": "bool",
                    };
                    for (let sym in builtinSymbols) {
                        if (sym.indexOf(prefix) != -1) {
                            completions.push({
                                name: sym,
                                value: sym,
                                meta: builtinSymbols[sym],
                            });
                        }
                    }

                    // Snippets for LTL operators
                    let ltlOps: { [key: string]: string; } = {
                        "Next": "Next ([\u2026])",
                        "Finally": "Finally ([\u2026])",
                        "Globally": "Globally ([\u2026])",
                        "Until": "([\u2026]) Until ([\u2026])",
                        "Exists": "Exists \u2026 : ([\u2026])"
                    };
                    for (let op in ltlOps) {
                        if (op.indexOf(prefix) != -1) {
                            completions.push({
                                name: op,
                                value: op,
                                meta: "LTL-Operator",
                                snippet: ltlOps[op],
                            });
                        }
                    }

                    // Completions for model symbols
                    stmt.bind(["%" + prefix + "%"]);
                    while (stmt.step()) { //
                        let r = stmt.getAsObject();
                        completions.push({
                            name: r["FullName"],
                            value: r["FullName"],
                            meta: r["SymbolType"]
                        });
                    }
                    stmt.reset();
                    if (completions.length > 0) {
                        callback(null, completions);
                    }
                }
            };
            langTools.setCompleters([completer]);
            this.ltlEditor.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true
            });
        });
    }

}

