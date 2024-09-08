import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChildren } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable
} from '@angular/material/table';
import { LabelComponent } from '../label/label.component';
import { Components } from "formiojs";
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import _BaseComponent from 'formiojs/components/_classes/component/Component';

const BaseComponent = _BaseComponent['default'] || _BaseComponent;

Components.components.table.prototype.render = function (...args) {
    return BaseComponent.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-table',
    template: `
        @if (component) {
            <mat-formio-form-field [component]="component"
                                   [componentTemplate]="componentTemplate"
                                   [labelTemplate]="labelTemplate"
            ></mat-formio-form-field>
            <ng-template #componentTemplate let-hasLabel>
                @if (hasLabel) {
                    <ng-container *ngTemplateOutlet="labelTemplate"></ng-container>
                }
            <table mat-table
                [dataSource]="dataSource"
                class="mat-elevation-z2 w-full"
                [ngClass]="{
                    'table-striped': component.striped,
                    'table-bordered': component.bordered
                }">
                @for (column of displayedColumns; let i = $index; track column) {
                    <ng-container [matColumnDef]="column">
                        @if (component.headers && component.headers.length) {
                            <th mat-header-cell *matHeaderCellDef>{{component.headers[i] | transloco }}</th>
                        }
                        <td mat-cell *matCellDef="let element" class="p-1">
                            <div #components></div>
                        </td>
                    </ng-container>
                }
                @if (component.headers && component.headers.length) {
                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                }
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            </ng-template>

            <ng-template #labelTemplate>
                <label class="mat-label" [component]="component" matFormioLabel  [standalone]="true"></label>
            </ng-template>
        }
    `,
    imports: [
        NgClass,
        TranslocoModule,
        MatCell,
        MatCellDef,
        MatColumnDef,
        MatHeaderCell,
        MatHeaderRow,
        MatHeaderRowDef,
        MatRow,
        MatRowDef,
        MatTable,
        MatHeaderCellDef,
        LabelComponent,
        FormioFormFieldComponent,
        NgTemplateOutlet
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTableComponent extends MaterialComponent {
    components = viewChildren('components', {read: ElementRef});
    dataSource = [];
    displayedColumns: string[] = [];
    initialized = false;

    constructor() {
        super();

        effect(() => {
            this.initialize()
        })
    }

    initialize() {
        if (this.instance) {
            if (!this.initialized) {
                this.dataSource = [];
                this.displayedColumns = [];
                for (let i = 0; i < this.component.rows[0].length; i++) {
                    this.displayedColumns.push(`${i}`)
                }
                for (const row of this.component.rows) {
                    const rd = {};
                    for (let i = 0; i < this.displayedColumns.length; i++) {
                        rd[this.displayedColumns[i]] = '';
                    }
                    // @ts-ignore
                    this.dataSource.push(rd);
                }

                this.initialized = true;
            }

            if (this.components() && this.components().length) {
                const tableComponents = this.instance.table.map(row => row.map(column =>
                        this.instance.renderComponents(column)
                    )
                )

                tableComponents.forEach((row, rowIndex) => {
                    row.forEach((column, colIndex) => {
                        const index =  rowIndex * this.component.rows[0].length  + colIndex;
                        const container = this.components()[index].nativeElement;
                        container.innerHTML = row[colIndex];
                        this.instance.attachComponents(container, this.instance.table[rowIndex][colIndex], this.component.rows[rowIndex][colIndex].components);

                        this.cdr.markForCheck();
                    })
                })
            }
        }
    }
}
