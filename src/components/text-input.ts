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

export enum TextInputState {
    OK,
    EDIT
}

type editButtonGlyphicons = "glyphicon-ok" | "glyphicon-pencil";

export class TextInput {
    private container: HTMLDivElement;
    private textField: HTMLInputElement;
    private editOkButton: HTMLButtonElement;
    private editOkButtonGlyphicon: HTMLSpanElement;
    private cancelButton: HTMLButtonElement;
    private state: TextInputState;
    private text: string;
    private keyChanged: (text: string) => boolean;
    constructor(text: string, keyChanged: (text: string) => boolean, loadedCB: () => void, state?: TextInputState) {
        this.text = text;
        this.keyChanged = keyChanged;
        this.state = state == null ? TextInputState.OK : state
        this.loadHtml(loadedCB);
    }

    getText(){
        return this.text;
    }

    private loadHtml(loadedCB: () => void, state?: TextInputState) {
        let self = this;
        $("<div>").load("multimodel/components/text-input.html #text-input-elem", function (event: JQueryEventObject) {
            self.container = <HTMLDivElement>(<HTMLDivElement>this).firstChild;
            self.initializeUI(state);
            loadedCB();
        });
    }

    private initializeUI(state?: TextInputState) {
        this.textField = <HTMLInputElement>this.container.querySelector("#text");
        this.editOkButton = <HTMLButtonElement>this.container.querySelector("#editOkButton");
        this.editOkButton.onclick = this.okEditClicked.bind(this);
        this.editOkButtonGlyphicon = <HTMLSpanElement>this.container.querySelector("#editOkButton-icon");
        this.cancelButton = <HTMLButtonElement>this.container.querySelector("#cancelButton");
        this.cancelButton.onclick = this.cancelClicked.bind(this);
        this.setTextUI(this.text);
        this.setState(this.state);
    }

    private setTextUI(text: string) {
        this.textField.value = text;
    }
    
    private getTextUI() {
        return this.textField.value;
    }

    private setState(state: TextInputState) {
        this.state = state;
        if (state == TextInputState.OK) {
            this.setButtonGlyphicon(this.editOkButtonGlyphicon, "glyphicon-pencil", "glyphicon-ok");
            this.textField.readOnly = true;
            this.hideElement(this.cancelButton);
        }
        else if (state == TextInputState.EDIT) {
            this.setButtonGlyphicon(this.editOkButtonGlyphicon, "glyphicon-ok", "glyphicon-pencil");
            this.textField.readOnly = false;
            this.showElement(this.cancelButton);
        }
    }

    hideElement(element: HTMLElement) {
        if (!element.classList.contains("hidden")) {
            element.classList.add("hidden");
        }
    }

    showElement(element: HTMLElement) {
        if (element.classList.contains("hidden")) {
            element.classList.remove("hidden");
        }
    }

    private setButtonGlyphicon(iconElement: HTMLElement, classToAdd: editButtonGlyphicons, classToRemove: editButtonGlyphicons) {
        if (iconElement.classList.contains(classToRemove)) {
            iconElement.classList.remove(classToRemove);
        }
        if (!iconElement.classList.contains(classToAdd))
        { iconElement.classList.add(classToAdd); }
    }
    private okEditClicked(event?: MouseEvent) {
        if (this.state == TextInputState.OK) {
            this.setState(TextInputState.EDIT);
        }
        else if (this.state == TextInputState.EDIT) {
            let previousText = this.text;
            this.text = this.getTextUI();
            if (this.keyChanged(this.getTextUI())) {
                this.setState(TextInputState.OK);
            }
            else {
                this.setTextUI(previousText);
                this.text = previousText;
                alert("Invalid");
            }
        }
    }

    private cancelClicked(event: MouseEvent) {
        if (this.keyChanged(this.text)) {
            this.setTextUI(this.text);
            this.okEditClicked();
        }
        else {
            alert("The key already exists");
        }

    }
    
    getContainer(){
        return this.container;
    }


}
