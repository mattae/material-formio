import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild, viewChildren } from '@angular/core';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { LabelComponent } from '../label/label.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormioComponent, FormioModule } from '@formio/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from 'formiojs';
import _ from 'lodash';

Components.components.editgrid.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
}

Components.components.editgrid.prototype.redraw = function (...args) {
}

enum EditRowState {
    NEW = 'new',
    EDITING = 'editing',
    SAVED = 'saved',
    REMOVED = 'removed',
    DRAFT = 'draft'
}

// Do nothing to createRowComponents, let formio handle it.
/* tslint:disable only-arrow-functions */
// @ts-ignore
Components.components.editgrid.prototype.createRowComponents = function () {
    return [];
};

// @ts-ignore
const checkRow = Components.components.editgrid.prototype.checkRow;
// @ts-ignore
Components.components.editgrid.prototype.checkRow = function (data, editRow, flags: any = {}) {
    if (flags.checkRow) {
        return checkRow.call(this, data, editRow, flags);
    } else {
        return true;
    }
};
/* tslint:enable only-arrow-functions */

const DEFAULT_HEADER_TEMPLATE = `
    <div class="flex">
        {% (components || []).forEach(function(component) { %}
            <div class="flex-1">{{ component.label }}</div>
        {% }) %}
    </div>
`;

const DEFAULT_ROW_TEMPLATE = `
    <div class="flex">
        {% util.eachComponent(components, function(component) { %}
            <div class="flex-1">
                {{ getView(component, row[component.key]) }}
            </div>
        {% }) %}
</div>
`;

@Component({
    selector: 'mat-formio-editgrid',
    templateUrl: './editgrid.component.html',
    imports: [
        FormioFormFieldComponent,
        MatExpansionModule,
        NgTemplateOutlet,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        FormioModule, TranslocoPipe,
        LabelComponent
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialEditGridComponent extends MaterialComponent {
    headerElement = viewChild('header', {read: ElementRef});
    footerElement = viewChild('footer', {read: ElementRef});
    components = viewChild('components', {read: ElementRef});
    rowElements = viewChildren('rows', {read: ElementRef});
    forms = viewChildren<FormioComponent>(FormioComponent);
    public header!: string;
    public footer!: string;
    public displayedColumns!: string[];
    public columns: any = {};
    public valid = true;
    public RowStates = EditRowState;

    constructor() {
        super();
        effect(() => {
            if (this.rowElements()) {
                const rowCache = {};
                this.rowElements().forEach((row: ElementRef, index) => this.updateRowTemplate(row, index, rowCache));
            }
            if (this.forms() && this.forms().length) {
                const forms = this.forms();
                for (let index = 0; index < this.forms().length; index++) {
                    const form = forms[index].formio;
                    form.components.forEach((component) => {
                        component.setPristine(false);
                        component.triggerChange();
                    });
                }
            }
            if (this.components()) {
                this.components()!.nativeElement.innerHTML = this.instance.renderComponents();
                this.instance.attachComponents(this.components()!.nativeElement)
            }
            if (this.headerElement()) {
                this.renderTemplate(this.headerElement()!, this.header);
            }
            if (this.footerElement()) {
                this.renderTemplate(this.footerElement()!, this.footer);
            }
        });
    }

    validate(index) {
        if (!this.forms()) {
            return;
        }
        const forms = this.forms();

        if (!forms[index]) {
            return;
        }
        const formioComponent = forms[index];
        const hasErrors = formioComponent.formio.components.some((component) => component.errors && component.errors.length);
        this.valid = !hasErrors;

        this.cdr.markForCheck();
    }

    formLoaded(row, index) {
        const forms = this.forms();
        if (forms[index]) {
            const form = forms[index].formio;

            form.submission = {data: JSON.parse(JSON.stringify(row.data))};

            this.instance.triggerChange();
            this.cdr.markForCheck();
        }
    }

    instanceInitialized(instance: any) {
        this.setInstance(instance);
        super.instanceInitialized(instance);
    }

    setInstance(instance) {
        this.displayedColumns = instance.component.components.map((comp) => {
            if (comp.hasOwnProperty('tableView') && !comp.tableView) {
                return false;
            }

            this.columns[comp.key] = comp;
            return comp.key;
        }).filter(name => !!name);
        const dataValue = instance.dataValue || [];
        if (instance.component.templates && instance.component.templates.header) {
            this.header = instance.renderString(_.get(this.component, 'templates.header', DEFAULT_HEADER_TEMPLATE), {
                components: instance.component.components,
                value: dataValue,
                displayValue: (component) => this.instance.displayComponentValue(component),
            });
        }
        if (instance.component.templates && instance.component.templates.footer) {
            this.footer = instance.renderString(_.get(this.component, 'templates.header', DEFAULT_HEADER_TEMPLATE), {
                components: instance.component.components,
                value: dataValue,
                displayValue: (component) => this.instance.displayComponentValue(component),
            });
        }
    }

    addAnother() {
        const row = this.instance.addRow();
        this.cdr.markForCheck();
    }

    removeRow(index: number) {
        this.instance.removeRow(index);

        this.cdr.markForCheck();
    }

    editRow(row, index) {
        const {state} = row;
        const {NEW, REMOVED} = this.RowStates;

        if (state === NEW || state === REMOVED) {
            return;
        }
        this.instance.editRow(index);

        this.cdr.markForCheck();
    }

    /**
     * Updates the row template.
     *
     * @param rowElement
     * @param index
     * @param comps
     */
    updateRowTemplate(rowElement: ElementRef, index, comps) {
        const editRow: any = {...this.instance.editRows[index]};
        if (editRow.state !== this.RowStates.NEW) {
            const flattenedComponents = this.instance.flattenComponents(index);
            this.renderTemplate(rowElement, this.instance.renderString(DEFAULT_ROW_TEMPLATE, {
                row: this.instance.dataValue[index] || {},
                data: this.instance.data,
                rowIndex: index,
                components: this.instance.component.components,
                displayValue: (component) => this.instance.displayComponentValue(component),
                isVisibleInRow: (component) => this.instance.isComponentVisibleInRow(component, flattenedComponents),
                getView: function getView(component, data) {
                    if (!comps[component.type]) {
                        comps[component.type] = Components.create(component, {}, {}, true);
                    }
                    return comps[component.type] ? comps[component.type].getView(data) : '';
                }
            }));

            this.cdr.markForCheck();
        }
    }

    /**
     * Saves a row.
     *
     * @param row - The edit grid row.
     * @param index - The index for this row.
     */
    saveRow(row, index) {
        const forms = this.forms();
        if (forms[index]) {
            const formioComponent = forms[index];
            row.data = JSON.parse(JSON.stringify(formioComponent.formio.submission.data));
            this.instance.saveRow(index);
            const rows = this.rowElements();
            if (rows && rows[index]) {
                this.updateRowTemplate(rows[index], index, {});

                this.cdr.markForCheck();
            }
        }
    }

    cancelRow(index) {
        this.instance.cancelRow(index);
        this.valid = true;

        this.cdr.markForCheck();
    }

    renderTemplate(element: ElementRef, template) {
        if (!element || !element.nativeElement) {
            return;
        }
        element.nativeElement.innerHTML = template;
    }

    trackedBy(row) {
        return row.id ?? row
    }
}
