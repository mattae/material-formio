import { ChangeDetectionStrategy, Component, effect, ElementRef, signal, viewChild, viewChildren } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { LabelComponent } from '../label/label.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgTemplateOutlet } from '@angular/common';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';
import { MatError } from '@angular/material/form-field';

const dataGridRender = Components.components.datagrid.prototype.render;
Components.components.datamap.prototype.render = function (...args) {
    dataGridRender.call(this, ...args);
}

Components.components.datagrid.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
}

Components.components.datagrid.prototype['getRowValues'] = function () {
    this.dataValue = this.dataValue || [];
    return this.dataValue;
}

Components.components.datagrid.prototype.focusOnNewRowElement = function (row) {
}

export const DATA_GRID_TEMPLATE = `
    @if (component) {
        <mat-formio-form-field [component]="component"
                               [componentTemplate]="componentTemplate"
                               [labelTemplate]="labelTemplate"
        ></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            @if (hasLabel) {
                <ng-container *ngTemplateOutlet="labelTemplate"></ng-container>
            }
            <mat-card class="w-full p-2" appearance="outlined">
                @if (instance().builderMode && component.type === 'datagrid') {
                    <div class="grid gap-4" #children [attr.style]="getColumns()"></div>
                } @else {
                    @if (instance().hasAddButton() && (instance().addAnotherPosition === 'both' || instance().addAnotherPosition === 'top') && !instance().builderMode) {
                        <mat-card-actions
                        >
                            <button mat-raised-button class="bg-primary text-on-primary"  (click)="addAnother()">
                                <mat-icon class="text-on-primary" svgIcon="heroicons_outline:plus-circle"></mat-icon>
                                {{ component.addAnother || 'Add another' | transloco }}
                            </button>
                        </mat-card-actions>
                    }
                    <table
                            mat-table
                            [dataSource]="dataSource"
                            class="mat-elevation-z2 w-full table-bordered"
                            cdkDropList
                            [cdkDropListData]="dataSource"
                            (cdkDropListDropped)="dropTable($event)">
                        >
                        @for (column of formColumns;track column) {
                            <ng-container [matColumnDef]="column">
                                <th mat-header-cell *matHeaderCellDef>{{ getColumnLabel(columns[column]) }}</th>
                                <td mat-cell *matCellDef="let i = index;" class="p-2">
                                    <div #components></div>
                                </td>
                            </ng-container>
                        }
                        <ng-container matColumnDef="__removeRow">
                            <th mat-header-cell *matHeaderCellDef></th>
                            <td mat-cell *matCellDef="let i = index;">
                                @if (instance().hasRemoveButtons()) {
                                    <button mat-icon-button (click)="removeRow(i)">
                                        <mat-icon svgIcon="heroicons_outline:trash" class="text-error" aria-label="Remove row"></mat-icon>
                                    </button>
                                }
                            </td>
                        </ng-container>
                        @if (component.reorder) {
                            <ng-container matColumnDef="position">
                                <th mat-header-cell *matHeaderCellDef></th>
                                <td mat-cell *matCellDef="let element">
                                    <mat-icon cdkDragHandle svgIcon="heroicons_outline:adjustments-vertical"></mat-icon>
                                </td>
                            </ng-container>
                        }
                        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                        @if (component?.reorder) {
                            <div>
                                <tr class="datagrid-row" mat-row *matRowDef="let row; columns: displayedColumns;"
                                    cdkDrag
                                    [cdkDragData]="row"></tr>
                            </div>
                        }
                        @if (!component?.reorder) {
                            <div>
                                <tr class="datagrid-row" mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                            </div>
                        }
                        <!-- Group header -->
                    <ng-container matColumnDef="groupHeader">
                        <mat-cell class="w-full" *matCellDef="let group">
                            @if (group.expanded) {
                                <mat-icon>expand_less</mat-icon>
                            } @else {
                                <mat-icon>expand_more</mat-icon>
                            }
                            <strong>{{ group[groupByColumns[group.level - 1]] }}</strong>
                        </mat-cell>
                    </ng-container>

                    <mat-row *matRowDef="let row; columns: ['groupHeader']; when: isGroup"
                             (click)="groupHeaderClick(row)"></mat-row>
                    </table>
                    @if (instance().hasAddButton() && instance().addAnotherPosition !== 'top' && !instance().builderMode) {
                        <mat-card-actions>
                            <button mat-raised-button class="bg-primary text-on-primary" (click)="addAnother()">
                                <mat-icon svgIcon="heroicons_outline:plus-circle" class="text-on-primary"></mat-icon>
                                {{ (component.addAnother || 'Add another') | transloco }}
                            </button>
                        </mat-card-actions>
                    }
                    @if (isError()) {
                        <mat-card-footer>
                            <mat-error class="text-error">{{ getErrorMessage() }}</mat-error>
                        </mat-card-footer>
                    }
                }
            </mat-card>
        </ng-template>

        <ng-template #labelTemplate>
            <label class="mat-label" [component]="component" matFormioLabel></label>
        </ng-template> 
    }
`

@Component({
    selector: 'mat-formio-datagrid',
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
                <mat-card class="w-full p-2" appearance="outlined">
                    @if (instance().builderMode && component.type === 'datagrid') {
                        <div class="grid gap-4" #children [attr.style]="getColumns()"></div>
                    } @else {
                        @if (instance().hasAddButton() && (instance().addAnotherPosition === 'both' || instance().addAnotherPosition === 'top') && !instance().builderMode) {
                            <mat-card-actions
                            >
                                <button mat-raised-button class="bg-primary text-on-primary" (click)="addAnother()">
                                    <mat-icon class="text-on-primary"
                                              svgIcon="heroicons_outline:plus-circle"></mat-icon>
                                    {{ component.addAnother || 'Add another' | transloco }}
                                </button>
                            </mat-card-actions>
                        }
                        <table
                                mat-table
                                [dataSource]="dataSource"
                                class="mat-elevation-z2 w-full table-bordered"
                                cdkDropList
                                [cdkDropListData]="dataSource"
                                (cdkDropListDropped)="dropTable($event)">
                            >
                            @for (column of formColumns; track column) {
                                <ng-container [matColumnDef]="column">
                                    <th mat-header-cell *matHeaderCellDef>{{ getColumnLabel(columns[column]) }}</th>
                                    <td mat-cell *matCellDef="let i = index;" class="p-2">
                                        <div #components></div>
                                    </td>
                                </ng-container>
                            }
                            <ng-container matColumnDef="__removeRow">
                                <th mat-header-cell *matHeaderCellDef></th>
                                <td mat-cell *matCellDef="let i = index;">
                                    @if (instance().hasRemoveButtons()) {
                                        <button mat-icon-button (click)="removeRow(i)">
                                            <mat-icon svgIcon="heroicons_outline:trash" class="text-error"
                                                      aria-label="Remove row"></mat-icon>
                                        </button>
                                    }
                                </td>
                            </ng-container>
                            @if (component.reorder) {
                                <ng-container matColumnDef="position">
                                    <th mat-header-cell *matHeaderCellDef></th>
                                    <td mat-cell *matCellDef="let element">
                                        <mat-icon cdkDragHandle
                                                  svgIcon="heroicons_outline:adjustments-vertical"></mat-icon>
                                    </td>
                                </ng-container>
                            }
                            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                            @if (component?.reorder) {
                                <div>
                                    <tr class="datagrid-row" mat-row *matRowDef="let row; columns: displayedColumns;"
                                        cdkDrag
                                        [cdkDragData]="row"></tr>
                                </div>
                            }
                            @if (!component?.reorder) {
                                <div>
                                    <tr class="datagrid-row" mat-row
                                        *matRowDef="let row; columns: displayedColumns;"></tr>
                                </div>
                            }
                            <!-- Group header -->
                            @if (instance().hasRowGroups()) {
                                <ng-container matColumnDef="groupHeader">
                                    <td colspan="999" mat-cell *matCellDef="let group">
                                        <div class="pl-2 space-x-1.5 flex items-center justify-items-end">
                                            @if (component.groupToggle) {
                                                @if (groups()[group[formColumns[0]]]) {
                                                    <mat-icon class="icon-size-5 text-current" svgIcon="heroicons_outline:chevron-up"></mat-icon>
                                                } @else {
                                                    <mat-icon class="icon-size-5 text-current" svgIcon="heroicons_outline:chevron-down"></mat-icon>
                                                }
                                            }
                                            <strong>{{ group[formColumns[0]] | transloco }}</strong>
                                        </div>
                                    </td>
                                </ng-container>

                                <tr mat-row *matRowDef="let row; let i = index; columns: ['groupHeader']; when: isGroup"
                                    (click)="groupHeaderClick(row)"></tr>
                            }
                        </table>
                        @if (instance().hasAddButton() && instance().addAnotherPosition !== 'top' && !instance().builderMode) {
                            <mat-card-actions>
                                <button mat-raised-button class="bg-primary text-on-primary" (click)="addAnother()">
                                    <mat-icon svgIcon="heroicons_outline:plus-circle"
                                              class="text-on-primary"></mat-icon>
                                    {{ (component.addAnother || 'Add another') | transloco }}
                                </button>
                            </mat-card-actions>
                        }
                        @if (isError()) {
                            <mat-card-footer>
                                <mat-error class="text-error">{{ getErrorMessage() }}</mat-error>
                            </mat-card-footer>
                        }
                    }
                </mat-card>
            </ng-template>

            <ng-template #labelTemplate>
                <label class="mat-label" [component]="component" matFormioLabel></label>
            </ng-template>
        }
    `,
    styles: [
        ':host { @apply p-0.5; }'
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
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialDataGridComponent extends MaterialComponent {
    groupByColumns: string[] = [];
    displayedColumns!: string[];
    formColumns!: string[];
    groups = signal<{ [key: string]: boolean }>({})
    columns: any;
    dataSource = []
    components = viewChildren('components', {read: ElementRef});
    children = viewChild('children', {read: ElementRef});
    groupHeaders = viewChildren('rowRef', {read: ElementRef})
    initialized = false;

    constructor() {
        super();
        effect(() => {
            if (this.instance()) {
                this.instance().root.on('beforeSetSubmission', ({data}) => {
                    if (data) {
                        this.instance().setValue(data)
                    }
                })
                this.initialize();
            }

            if (this.children()) {
                this.children()!.nativeElement.innerHTML = this.instance().renderComponents();
                this.instance().attachComponents(this.children()!.nativeElement)
            }
        });
    }

    getColumnLabel(column) {
        return column.label || column.key;
    }

    initialize() {
        if (!this.initialized) {
            const component = this.instance();
            this.columns = {};
            this.displayedColumns = [];
            this.formColumns = [];
            component.getColumns().map((column) => {
                this.formColumns.push(column.key);
                this.displayedColumns.push(column.key);
                this.columns[column.key] = column;
            });

            this.displayedColumns.push('__removeRow');
            if (this.instance().component.reorder) {
                this.displayedColumns.push('position');
            }

            if (this.instance().hasRowGroups()) {
                this.dataSource = Object.keys(this.instance().getGroups()).flatMap(idx => {
                    const group = this.instance().getGroups()[idx];
                    const rows = [];
                    rows.push({
                        [this.formColumns[0]]: group.label.trim(),
                        isGroup: true
                    });

                    this.groups.update((prevValues) => ({
                        ...prevValues,
                        [this.translocoService.translate(group.label.trim())]: true,
                    }));

                    for (let i = 0; i < group.numberOfRows; i++) {
                        rows.push({})
                    }

                    return rows;
                });
            } else {
                this.dataSource = component.dataValue;
            }
            this.initialized = true
        }

        if (this.components()) {
            this.renderComponents();
        }
    }

    addAnother() {
        this.checkRowsNumber();
        this.instance().addRow();
        if (this.dataSource.length < this.instance().rows.length) {
            this.dataSource.push({});
        }
        this.dataSource = [...this.dataSource];

        this.initialized = false;
    }

    checkRowsNumber() {
        while (this.instance().rows.length < this.dataSource.length) {
            this.instance().addRow();
        }
    }

    removeRow(index) {
        this.instance().removeRow(index);
        this.initialized = false;
    }

    dropTable(event: CdkDragDrop<any>) {
        const prevIndex = this.dataSource.findIndex((d) => d === event.item.data);
        moveItemInArray(this.instance().dataValue, prevIndex, event.currentIndex);
        this.instance().setValue(this.instance().dataValue, {isReordered: true});

        this.initialized = false;
    }

    renderComponents() {
        if (this.components() && this.components().length) {
            const rows = this.instance().getRows();
            const columns = this.instance().getColumns();
            const columnLength = rows.length;
            columns.forEach((col, columnIndex) => {
                let rowIndex = 0;
                rows.forEach((row) => {
                    const index = (columnIndex * columnLength) + rowIndex;
                    const container = this.components()[index].nativeElement;
                    container.innerHTML = rows[rowIndex][col.key];
                    this.instance().attachComponents(
                        container,
                        [this.instance().rows[rowIndex][col.key]],
                        this.instance().getComponentsContainer(),
                    );
                    this.cdr.markForCheck();

                    rowIndex++;
                });
            });
        }
        this.instance().setValue(this.control.value || []);

        this.cdr.markForCheck();
    }

    setValue(value: [] | null) {
        value = value || [];
        const gridLength = value ? value.length : 0;
        while (this.instance().rows.length < gridLength) {
            this.addAnother();
            this.instance().dataValue = value;
            this.instance().updateValue(value, {modified: true});
        }

        if (!value && this.component.component.clearOnHide) {
            this.dataSource = this.component.defaultValue;
        }
        super.setValue(value);
    }

    getColumns() {
        let columns = this.children()!.nativeElement.children.length;
        if (columns > 1) {
            columns += 1;
        }
        return `grid-template-columns: repeat(${columns}, minmax(0, 1fr)) !important;`;
    }

    groupHeaderClick(row: any) {
        if (!this.component.groupToggle) {
            return;
        }
        const groupName = (row[this.formColumns[0]]).trim();

        const rows = this.getRowsForGroup(groupName);
        const expanded = this.groups()[groupName];
        if (expanded) {
            this.groups.update((prevValues) => ({
                ...prevValues,
                [groupName]: false,
            }));
            rows.forEach(_row => _row.classList.add('hidden'));
        } else {
            this.groups.update((prevValues) => ({
                ...prevValues,
                [groupName]: true,
            }));
            rows.forEach(_row => _row.classList.remove('hidden'))
        }

    }

    isGroup(_, row: { isGroup: boolean; }): boolean {
        return row.isGroup;
    }

    getRowsForGroup(groupName: string) {
        const groupHeaders = document.querySelectorAll('td.mat-column-groupHeader');
        let rows = [];

        groupHeaders.forEach((header) => {
            const groupHeaderText = header.textContent.trim();
            if (groupHeaderText === groupName.trim()) {
                let sibling = header.parentElement.nextElementSibling;
                while (sibling && Array.from(sibling.classList).includes('datagrid-row')) {
                    rows.push(sibling);
                    sibling = sibling.nextElementSibling;
                }
            }
        });

        return rows;
    }
}
