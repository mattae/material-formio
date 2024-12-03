import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DATA_GRID_TEMPLATE, MaterialDataGridComponent } from '../datagrid/datagrid.component';
import { LabelComponent } from '../label/label.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { NgTemplateOutlet } from '@angular/common';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { TranslocoModule } from '@jsverse/transloco';
import { MatError } from '@angular/material/form-field';
import { Utils } from '@formio/js';
import iterateKey = Utils.iterateKey;

Utils.uniqueKey = function uniqueKey(map, base) {
    let newKey = base;
    while (map.hasOwnProperty(newKey) && map[base]) {
        newKey = iterateKey(newKey);
    }

    return newKey;
}

@Component({
    selector: 'mat-formio-datamap',
    template: DATA_GRID_TEMPLATE,
    standalone: true,
    styles: [
        ':host() { @apply p-0.5; }'
    ],
    imports: [
        LabelComponent,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        CdkDrag,
        MatTableModule,
        CdkDropList,
        NgTemplateOutlet,
        FormioFormFieldComponent,
        TranslocoModule,
        CdkDragHandle,
        MatError
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialDatamapComponent extends MaterialDataGridComponent {
    addAnother() {
        this.instance.addRow();
        // @ts-ignore
        this.dataSource.push({});
        this.dataSource = [...this.dataSource];
        this.initialized = false;

        this.cdr.markForCheck();
    }

    initialize() {
        if (!this.initialized) {
            const component = this.instance;
            this.columns = {};
            this.displayedColumns = [];
            this.formColumns = [];
            component.getColumns().map((column) => {
                this.formColumns.push(column.key);
                this.displayedColumns.push(column.key);
                this.columns[column.key] = column;
            });

            this.displayedColumns.push('__removeRow');
            if (this.instance.component.reorder) {
                this.displayedColumns.push('position');
            }
            this.initialized = true
        }

        if (this.components()) {
            this.renderComponents();
        }
    }

    setValue(value: {} | null) {
        value = value || {};
        const rowValues = this.instance.getRowValues();

        this.dataSource = [];
        Object.keys(value).forEach((_: any) => {
            // @ts-ignore
            this.dataSource.push({});
        });
        // Delete any extra rows.
        const removedRows = this.instance.rows.splice(rowValues.length);
        const removed = !!removedRows.length;
        if (removed) {
            this.dataSource.splice(rowValues.length)
        }
        this.control.patchValue(value);
        this.cdr.markForCheck();
    }
}
