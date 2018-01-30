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

import { OnInit, Component, ViewChild, ElementRef, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs/Rx";

declare let Plotly: any;

@Component({
    selector: 'line-chart',
    template: ''
})
export class LineChartComponent implements OnInit {
    private loading: boolean = true;
    private redrawCooldown: boolean = false;

    private lastUpdateTime: number = 0;
    private lastDatasets: Array<any>;
    private layout = {
        legend: {
            orientation: "v",
            x: 0,
            y: -0.1,
            xanchor: "left",
            yanchor: "top",
            tracegroupgap: 20
        },
        margin: {
            l: 25, r: 25, b: 25, t: 25, pad: 0
        },
        xaxis: {
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            showline: false
        },
        showlegend: true,
    };

    private options = {
        displaylogo: false
    };

    constructor(private element: ElementRef) {

    }

    @Input()
    set datasets(datasets: BehaviorSubject<any>) {
        datasets.subscribe(datasets => { this.lastDatasets = datasets; this.redraw(datasets) });
    }

    @Input()
    set finished(isFinished: boolean){
        
        if(isFinished) {
            this.draw(this.lastDatasets);
        }
    }

    @Input()
    set something(something: any) {
        this.redrawLayoutChange();
    }

    private redrawLayoutChange() {
        let node = Plotly.d3
            .select(this.element.nativeElement)
            .style({
                width: '100%',
                height: '80vh',
                display: 'block',

            })
            .node();

        Plotly
            .newPlot(node, [], this.layout, this.options)
            .then(() => this.loading = false);

        Plotly.Plots.resize(node);
    }

    private visibleRows: number = 1;

    @Input()
    set livegraphvisiblerowcount(rows: number) {
        if (rows < 1)
            rows = 1;
        this.visibleRows = rows;
        let node = Plotly.d3
            .select(this.element.nativeElement)
            .style({
                width: '100%',
                height: this.visibleRows + 'vh',
                display: 'block',

            })
            .node();
        this.redrawLayoutChange();
    }

    ngOnInit() {
        let node = Plotly.d3
            .select(this.element.nativeElement)
            .style({
                width: '100%',
                height: (80 / this.visibleRows) + 'vh',
                display: 'block',

            })
            .node();

        Plotly
            .newPlot(node, [], this.layout, this.options)
            .then(() => this.loading = false);

        window.addEventListener('resize', e => Plotly.Plots.resize(node));
    }

    private draw(datasets: Array<any>)
    {
        this.element.nativeElement.data = datasets;
        requestAnimationFrame(() => {
            Plotly.redraw(this.element.nativeElement);
            this.redrawCooldown = false;
            this.lastUpdateTime = Date.now();
        });
    }

    private redraw(datasets: Array<any>) {
        if (this.loading) return;

        if (this.redrawCooldown === false && Date.now() - this.lastUpdateTime > 150) {
            this.redrawCooldown = true;
            this.draw(datasets);
        }
    }
}
