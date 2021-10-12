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

import { Component, Input, OnDestroy, AfterContentInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { DataRepeaterDtpType, DtpTypes, IDtpType} from "../../../intocps-configurations/dtp-configuration";
import { Observable, Subscription } from "rxjs";

@Component({
    selector: 'data-repeater',
    templateUrl: "./angular2-app/dtp/inputs/datarepeater.component.html"
})
export class DtpDataRepeaterComponent implements AfterContentInit, OnDestroy{
    private typesArrayChangedEventSubscription: Subscription;
    
    @Input()
    dtpType: DataRepeaterDtpType

    @Input()
    formGroup:FormGroup;

    @Input()
    editing: boolean = false;

    @Input()
    dtpTypes: IDtpType[];

    @Input()
    typesArrayChangedEvent: Observable<void>;

    selectedSignal: string;

    showSelectGroup: boolean = true;

    constructor() {
        console.log("DataRepeater component constructor");
    }

    ngAfterContentInit(): void {
        this.typesArrayChangedEventSubscription = this.typesArrayChangedEvent.subscribe(() => this.syncTasksWithTypes());
        this.updateSelectedSignal();
    }

    ngOnDestroy() {
        this.typesArrayChangedEventSubscription.unsubscribe();
    }

    syncTasksWithTypes() {
        const indeciesToRemove = this.dtpType.signals.reduce((indecies, signal) => {
            if (!this.dtpTypes.includes(signal)) {
                const index = this.dtpType.signals.findIndex(signal2 => signal2.name == signal.name && signal2.type == signal.type);
                if(index >= 0){
                    indecies.push(index);
                }
            }
            return indecies;
        }, []);

        for (var i = indeciesToRemove.length -1; i >= 0; i--){
            this.dtpType.signals.splice(indeciesToRemove[i], 1);
        }
        this.updateSelectedSignal();
    }

    updateSelectedSignal() {
        this.selectedSignal = this.getRemaningSignalsNames()[0] ?? "";
        this.showSelectGroup = this.selectedSignal != "";
    }

    getRemaningSignalsNames(): string[] {
        const signals = this.dtpTypes.reduce((signals: string[], idtpType) => {
            if (!this.dtpType.signals.includes(idtpType) && idtpType.type == DtpTypes.SignalDtpType) {
                signals.push(idtpType.name);
            }
            return signals;
        }, []);
        return signals.sort();
    }

    addSignal(){
        const signal = this.dtpTypes.find(type => type.type == DtpTypes.SignalDtpType && type.name == this.selectedSignal);
        this.dtpType.signals.push(signal);
        this.updateSelectedSignal();
    }

    removeSignal(signal: IDtpType){
        const index = this.dtpType.signals.indexOf(signal, 0);
        if (index > -1) {
            this.dtpType.signals.splice(index, 1);
        }
        this.updateSelectedSignal();
    }
}

