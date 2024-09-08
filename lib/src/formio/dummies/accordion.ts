import { Component } from '@angular/core';
import {
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
} from '@angular/material/expansion';

@Component({
    selector: 'fio-dummy-accordion',
    standalone: true,
    imports: [
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelTitle,
        MatExpansionPanelHeader
    ],
    template: `
        <mat-accordion class="hidden">
            <mat-expansion-panel>
                <mat-expansion-panel-header>
                    <mat-panel-title></mat-panel-title>
                </mat-expansion-panel-header>
            </mat-expansion-panel>
        </mat-accordion>
    `
})
export class DummyAccordion {
}
