import { ChangeDetectionStrategy, Component } from '@angular/core';
import _ from 'lodash';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatSelectModule } from '@angular/material/select';
import { LabelComponent } from '../label/label.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';

Components.components.select.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-select',
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <mat-form-field class="w-full"
                            [subscriptSizing]="'dynamic'">

                @if (hasLabel) {
                    <mat-label>
                        <span [component]="component" matFormioLabel></span>
                    </mat-label>
                }

                @if (component.prefix) {
                    <span matPrefix>
                    {{ component.prefix }}&nbsp;
                </span>
                }
                <mat-select
                    [multiple]="component.multiple"
                    [formControl]="control"
                    [placeholder]="component.placeholder | transloco"
                    (selectionChange)="onChange()"
                    [compareWith]="compareObjects"
                >
                    <div class="mat-option m-3.5 border ring-1 ring-primary relative top-0">
                        <input class="m-2 mat-input-element w-full" [placeholder]="'CORE.FORMIO.SELECT.SEARCH' | transloco"
                               (input)="onFilter($event.target)">
                    </div>
                    @if (!filteredOptionsLength) {
                        <mat-option disabled>
                            <span>{{ 'CORE.FORMIO.SELECT.NO_ITEMS' | transloco }}</span>
                        </mat-option>
                    }
                    <mat-option >Please select item</mat-option>
                    @for (option of filteredOptions; track option) {
                        <mat-option [value]="option.value?.value || option.value">
                            <span [innerHTML]="option.label | transloco"></span>
                        </mat-option>
                    }
                </mat-select>

                @if (component.suffix) {
                    <span matSuffix>
                        {{ component.suffix }}
                    </span>
                }
                @if ( component.description) {
                    <mat-hint>
                        <span [innerHTML]="component.description | transloco"></span>
                    </mat-hint>
                }
                @if (isError()) {
                    <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                }
            </mat-form-field>
        </ng-template>
    `,
    imports: [
        FormioFormFieldComponent,
        MatSelectModule,
        LabelComponent,
        ReactiveFormsModule,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialSelectComponent extends MaterialComponent {
    _selectOptions = [];
    filteredOptions = [];
    filteredOptionsLength = 0;

    get selectOptions() {
        return this._selectOptions;
    }

    onFilter(event: any) {
        const value = event.value.toLowerCase().trim();
        const filtered = this.selectOptions.filter((option: any) => option.label?.toLowerCase().indexOf(value) !== -1);
        this.filteredOptionsLength = filtered.length;
        this.filteredOptions = filtered;

        this.cdr.markForCheck();
    }

    compareObjects(o1: any, o2: any): boolean {
        return _.isEqual(o1, o2);
    }

    getValue(): any | string {
        return this.control.value
    }

    onChange(keepInputRaw?: boolean) {
        super.onChange(keepInputRaw);

        this.cdr.markForCheck();
    }

    instanceInitialized(instance: any) {
        super.instanceInitialized(instance)

        this.instance.itemsLoadedResolve = () => {
            this._selectOptions = this.instance.selectOptions;
            this.filteredOptions = this.instance.selectOptions;
            this.filteredOptionsLength = this.instance.selectOptions.length;

            this.cdr.markForCheck();
        }
        this.instance.updateItems(null, true);
    }
}

