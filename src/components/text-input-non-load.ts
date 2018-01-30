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

import {TextInputState} from "./text-input";
import {glyphiconEditButton} from "./types";
import {Component} from "./component";

export class TextInputIds {
    textId: string;
    editOkButton: string;
    cancelButton: string;
    constructor(textId?: string, editOkButton?: string, cancelButton?: string) {
        if (textId == null && editOkButton == null && cancelButton == null) {
            this.textId = "text";
            this.editOkButton = "editOkButton";
            this.cancelButton = "cancelButton";
        }
        else {
            this.textId = textId;
            this.editOkButton = editOkButton;
            this.cancelButton = cancelButton;
        }
    }

}

export class TextInputNonLoad {
    private container: HTMLElement;
    private textField: HTMLInputElement;
    private editOkButton: HTMLButtonElement;
    private editOkButtonGlyphicon: HTMLSpanElement;
    private cancelButton: HTMLButtonElement;
    private state: TextInputState;
    private text: string;
    private keyChanged: (text: string) => boolean;
    private ids: TextInputIds;
    constructor(container: HTMLElement, text: string, keyChanged: (text: string) => boolean, ids: TextInputIds, state?: TextInputState) {
        this.text = text;
        this.container = container;
        this.keyChanged = keyChanged;
        this.ids = ids;
        if (ids.cancelButton)
            this.initializeUI(state == null ? TextInputState.OK : state);
    }

    getText() {
        return this.text;
    }

    private initializeUI(state: TextInputState) {
        this.textField = <HTMLInputElement>this.container.querySelector("#" + this.ids.textId);
        this.editOkButton = <HTMLButtonElement>this.container.querySelector("#" + this.ids.editOkButton);
        this.editOkButton.onclick = this.okEditClicked.bind(this);
        this.editOkButtonGlyphicon = <HTMLSpanElement>this.editOkButton.querySelector("span");
        this.cancelButton = <HTMLButtonElement>this.container.querySelector("#" + this.ids.cancelButton);
        this.cancelButton.onclick = this.cancelClicked.bind(this);
        this.setTextUI(this.text);
        this.setState(state);
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
            Component.hide(this.cancelButton);
        }
        else if (state == TextInputState.EDIT) {
            this.setButtonGlyphicon(this.editOkButtonGlyphicon, "glyphicon-ok", "glyphicon-pencil");
            this.textField.readOnly = false;
            Component.show(this.cancelButton);
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

    private setButtonGlyphicon(iconElement: HTMLElement, classToAdd: glyphiconEditButton, classToRemove: glyphiconEditButton) {
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

    getContainer() {
        return this.container;
    }


}
