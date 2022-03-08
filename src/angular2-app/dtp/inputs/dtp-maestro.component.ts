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

import { Component, Input, AfterContentInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { DTPConfig, MaestroDtpItem, ToolDtpItem, ToolType } from "../dtp-configuration";
import IntoCpsApp from "../../../IntoCpsApp";
import * as Path from "path";
import * as fs from "fs";
import { checksum, Project } from "../../../proj/Project";

@Component({
    selector: "dtp-maestro",
    templateUrl: "./angular2-app/dtp/inputs/dtp-maestro.component.html",
})
export class DtpMaestroComponent implements AfterContentInit {
    @Input()
    maestro: MaestroDtpItem;

    @Input()
    formGroup: FormGroup;

    @Input()
    editing: boolean = true;

    @Input()
    config: DTPConfig;

    configurationPath: string = "";

    configurationPaths: string[] = this.getConfigurationPaths(
        Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), Project.PATH_MULTI_MODELS)
    );

    showInitialSetupBtns: boolean = false;

    showConfigurationSelect: boolean = false;

    getSimulationTools(): ToolDtpItem[] {
        return this.config.tools.reduce((maestroToolNames: ToolDtpItem[], tool: ToolDtpItem) => {
            if (tool.type == ToolType.maestroV2) {
                maestroToolNames.push(tool);
            }
            return maestroToolNames;
        }, []);
    }

    toolIdToName(toolId: string): string {
        return this.getSimulationTools().find((tool) => tool.id == toolId)?.name ?? "";
    }

    ngAfterContentInit(): void {
        if (this.maestro.multiModelPath != "") {
            if (fs.existsSync(this.maestro.multiModelPath)) {
                return;
            } else {
                console.error(`Unable to locate multi-model at: ${this.maestro.multiModelPath}.`);
            }
        }

        if (!this.maestro.isCreatedOnServer) {
            this.maestro.tool = this.getSimulationTools().length > 0 ? this.getSimulationTools()[0].id : "";
        }
        this.showInitialSetupBtns = true;
    }

    hasUniqueName(): boolean {
        return this.formGroup.parent.hasError("notUnique") && this.formGroup.parent.errors.notUnique === this.maestro.id;
    }

    onChangeName(name: string) {
        this.maestro.name = name;
    }

    onChangeCaptureOutput(captureOutput: boolean) {
        this.maestro.capture_output = captureOutput;
    }

    protected async onConfigurationSet() {
        if (!fs.existsSync(this.configurationPath)) {
            return;
        }
        const mm_destination: string = Path.join(this.config.projectPath, this.generateMultiModelName());
        const coe_destination: string = Path.join(this.config.projectPath, this.generateCoeConfName());
        const mm_source: string = Path.join(this.configurationPath, "..");
        const coe_source: string = this.configurationPath;

        // Make a copy of the multi model and coe file so that changes can be reflected in these.
        await fs.promises.readdir(mm_source).then(async (files: string[]) => {
            const mm_name = files.find((fileName: string) => fileName.toLowerCase().endsWith("mm.json"));
            if (mm_name) {
                const mm_sourceName: string = Path.join(mm_source, mm_name);
                await fs.promises
                    .copyFile(mm_sourceName, mm_destination)
                    .then(() => (this.maestro.multiModelPath = mm_destination))
                    .catch((err) => console.warn(`Unable to copy multi model from: ${mm_sourceName} to ${mm_destination}: "${err}"`));
            } else {
                console.warn(`Unable to locate multi model in: ${mm_source}.`);
            }
        });
        await fs.promises.readdir(coe_source).then(async (files: string[]) => {
            const coe_name: string = files.find((fileName) => fileName.toLowerCase().endsWith("coe.json"));
            if (coe_name) {
                const coe_sourceName: string = Path.join(coe_source, coe_name);
                await fs.promises
                    .copyFile(coe_sourceName, coe_destination)
                    .then(() => {
                        this.maestro.coePath = coe_destination;
                        // Change the relative mmPath to the copied mm file.
                        const coeObj: any = JSON.parse(fs.readFileSync(coe_destination, { encoding: "utf8", flag: "r" }));
                        coeObj["multimodel_path"] = Path.relative(
                            IntoCpsApp.getInstance().getActiveProject().getRootFilePath(),
                            mm_destination
                        );
                        fs.writeFileSync(coe_destination, JSON.stringify(coeObj));
                    })
                    .catch((err) => console.warn(`Unable to copy coe file from: ${coe_sourceName} to ${coe_destination}: "${err}"`));
            } else {
                console.warn(`Unable to locate coe file in: ${coe_source}.`);
            }
        });
        this.maestro.linkToCoeAndMMPath(this.config.fileLinksPath);
        this.showConfigurationSelect = false;
    }

    protected doInitialSetup(setupFromConfig: boolean) {
        this.showInitialSetupBtns = false;
        this.showConfigurationSelect = setupFromConfig;
        if (!setupFromConfig) {
            this.maestro.multiModelPath = Path.join(this.config.projectPath, this.generateMultiModelName());
            fs.writeFileSync(this.maestro.multiModelPath, "{}", "utf-8");

            this.maestro.coePath = Path.join(this.config.projectPath, this.generateCoeConfName());

            let data = '{"algorithm":{"type":"fixed-step","size":0.1},"endTime":10,"startTime":0}';
            const json = JSON.parse(data + "");
            json["multimodel_crc"] = checksum(fs.readFileSync(this.maestro.multiModelPath).toString(), "md5", "hex");

            data = JSON.stringify(json);

            fs.writeFileSync(this.maestro.coePath, data, "utf-8");

            this.maestro.linkToCoeAndMMPath(this.config.fileLinksPath);
        }
    }

    protected getConfigurationNameFromPath(path: string, depth: number): string {
        let elems = path.split(Path.sep);
        if (elems.length <= 1) {
            return path;
        }
        let pathToReturn = "";
        for (let i = depth; i >= 1; i--) {
            pathToReturn += elems[elems.length - i] + (i == 1 ? "" : " | ");
        }
        return pathToReturn;
    }

    private getConfigurationPaths(path: string): string[] {
        let configurationPaths: string[] = [];
        let files = fs.readdirSync(path);
        if (files.findIndex((f) => f.endsWith("coe.json")) != -1) {
            configurationPaths.push(path);
        } else {
            for (let i in files) {
                let fileName = Path.join(path, files[i]);
                if (fs.statSync(fileName).isDirectory()) {
                    configurationPaths = configurationPaths.concat(this.getConfigurationPaths(fileName));
                }
            }
        }
        return configurationPaths;
    }

    private generateCoeConfName(): string {
        return (this.maestro.name ? this.maestro.name + "_" : "") + this.maestro.id + "_simConf.json";
    }

    private generateMultiModelName(): string {
        return (this.maestro.name ? this.maestro.name + "_" : "") + this.maestro.id + "_multiModel.json";
    }
}
