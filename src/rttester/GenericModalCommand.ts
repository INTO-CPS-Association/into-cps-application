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



export class GenericModalCommand {
    hAbortButton: HTMLButtonElement;
    hCloseButton: HTMLButtonElement;
    hOutputText: HTMLTextAreaElement;

    constructor() { }
    load(onLoad: () => void) {
        let self = this;
        $("#modalDialog").load("rttester/GenericModalCommand.html", (event: JQueryEventObject) => {
            self.hAbortButton = <HTMLButtonElement>document.getElementById("modalAbort");
            self.hCloseButton = <HTMLButtonElement>document.getElementById("modalClose");
            self.hOutputText = <HTMLTextAreaElement>document.getElementById("modalOutputText");
            onLoad();
            (<any>$("#modalDialog")).modal({ keyboard: false, backdrop: false });
        });
    }
    setTitle(title: string) {
        document.getElementById("modalTitle").innerText = title;
    }
    appendLog(s: string) {
        let hOutputText: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("modalOutputText");
        hOutputText.textContent += s;
        hOutputText.scrollTop = hOutputText.scrollHeight;
    }
    displayTermination(success: boolean) {
        document.getElementById("modalRUN").style.display = "none";
        document.getElementById(success ? "modalFAIL" : "modalOK").style.display = "none";
        document.getElementById(success ? "modalOK" : "modalFAIL").style.display = "block";
        this.hCloseButton.style.display = "initial";
        this.hAbortButton.style.display = "none";
    }
    setAbortCallback(abort: (c: GenericModalCommand) => void) {
        let self = this;
        this.hAbortButton.style.display = "initial";
        this.hAbortButton.onclick = () => {
            abort(self);
        };
    }
    allowClose() {
        this.hCloseButton.style.display = "initial";
    }
    run(cmd: (c: GenericModalCommand) => void) {
        let self = this;
        self.hCloseButton.style.display = "none";
        cmd(self);
    }
}

export function load(title: string, onRun: (cmd: GenericModalCommand) => void): void {
    let cmd = new GenericModalCommand();
    cmd.load(() => {
        cmd.setTitle(title);
        cmd.run(onRun)
    });
}

export function runCommand(cmd: any): void {
    if (cmd.arguments == undefined)
        cmd.arguments = [];
    if (cmd.background == undefined)
        cmd.background = false;
    if (cmd.options == undefined)
        cmd.options = {};
    if (cmd.options.env == undefined)
        cmd.options.env = process.env;

    load(cmd.title, (c: GenericModalCommand) => {
        const spawn = require("child_process").spawn;
        const child = spawn(cmd.command, cmd.arguments, cmd.options);
        child.stdout.on("data", c.appendLog.bind(c));
        child.stderr.on("data", c.appendLog.bind(c));
        child.on("exit", (code: number) => {
            c.displayTermination(code == 0);
            if (code == 0 && cmd.onSuccess)
                cmd.onSuccess(c);
            if (code == 1 && cmd.onFailure)
                cmd.onFailure(c);
        });
        c.setAbortCallback(() => { child.kill(); });
        if (cmd.background) {
            c.allowClose();
        }
    });
}

