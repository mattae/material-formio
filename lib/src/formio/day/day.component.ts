import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LabelComponent } from '../label/label.component';
import { MatSelectModule } from '@angular/material/select';
import { MaterialComponent } from '../material.component';
import { Components, Utils } from 'formiojs';
import { TranslocoPipe } from '@jsverse/transloco';
import getLocaleDateFormatInfo = Utils.getLocaleDateFormatInfo;
import _BaseComponent from 'formiojs/components/_classes/component/Component';

const BaseComponent = _BaseComponent['default'] || _BaseComponent;

Components.components.day.prototype.render = function (...args) {
    return BaseComponent.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-day',
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            @if (hasLabel) {
                <mat-label>
                    <span [component]="component" matFormioLabel></span>
                </mat-label>
            }
            <div class="grid grid-cols-3 gap-1">
                @if (dayFirst && instance.showDay) {
                    <mat-form-field>
                        @if (!instance.component.hideInputLabels) {
                            <mat-label>Day</mat-label>
                        }
                        <mat-select [formControl]="dayControl" (selectionChange)="onChange()"
                                    [required]="instance.dayRequired">
                            @for (day of instance.days;track day) {
                                <mat-option [value]="day.value">
                                    {{ day.label }}
                                </mat-option>
                            }
                        </mat-select>
                        @if (dayFirst && isError()) {
                            <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                        }
                    </mat-form-field>
                }
                @if (instance.showMonth) {
                    <mat-form-field>
                        @if (!instance.component.hideInputLabels) {
                            <mat-label>Month</mat-label>
                        }
                        <mat-select [formControl]="monthControl" (selectionChange)="onChange()"
                                    [required]="instance.monthRequired">
                            @for (month of instance.months;track month) {
                                <mat-option [value]="month.value">
                                    {{ month.label }}
                                </mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                }
                @if (!dayFirst && instance.showDay) {
                    <mat-form-field>
                        @if (!instance.component.hideInputLabels) {
                            <mat-label>Day</mat-label>
                        }
                        <mat-select [formControl]="dayControl" (selectionChange)="onChange()"
                                    [required]="instance.dayRequired">
                            @for (day of instance.days;track day) {
                                <mat-option [value]="day.value">
                                    {{ day.label }}
                                </mat-option>
                            }
                        </mat-select>
                        @if (!dayFirst && isError()) {
                            <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                        }
                    </mat-form-field>
                }
                @if (instance.showYear) {
                    <mat-form-field>
                        @if (!instance.component.hideInputLabels) {
                            <mat-label>Year</mat-label>
                        }
                        <mat-select [formControl]="yearControl" (selectionChange)="onChange()"
                                    [required]="instance.yearRequired">
                            @for (year of instance.years;track year) {
                                <mat-option [value]="year.value">
                                    {{ year.label }}
                                </mat-option>
                            }
                        </mat-select>
                    </mat-form-field>
                }
            </div>
        </ng-template>
    `,
    imports: [
        FormioFormFieldComponent,
        MatFormFieldModule,
        LabelComponent,
        MatSelectModule,
        ReactiveFormsModule,
        LabelComponent,
        FormioFormFieldComponent,
        TranslocoPipe,
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialDayComponent extends MaterialComponent {
    dayFirst: boolean;
    public dayControl: FormControl = new FormControl();
    public monthControl: FormControl = new FormControl();
    public yearControl: FormControl = new FormControl();

    constructor() {
        super();

        effect(() => {
            if (this.instance) {
                this.initialize();
            }
        });
    }

    setDisabled(disabled) {
        if (disabled) {
            this.dayControl.disable();
            this.monthControl.disable();
            this.yearControl.disable();
        } else {
            this.dayControl.enable();
            this.monthControl.enable();
            this.yearControl.enable();
        }
    }

    getValue() {
        return this.instance.getDate();
    }

    setValue(value) {
        if (value) {
            if (!value || value === 'Invalid date') {
                return null;
            }
            const parts = value.split('/');
            let day;
            if (this.component.dayFirst) {
                day = parts.shift();
            }
            const month = parts.shift();
            if (!this.component.dayFirst) {
                day = parts.shift();
            }
            const year = parts.shift();

            if (this.instance.showDay) {
                this.dayControl.setValue(day === '00' ? '' : parseInt(day, 10));
            }
            if (this.instance.showMonth) {
                this.monthControl.setValue(month === '00' ? '' : parseInt(month, 10));
            }
            if (this.instance.showYear) {
                this.yearControl.setValue(year === '0000' ? '' : parseInt(year, 10));
            }
        }
        return this.instance.setValueAt(0, value);
    }

    initialize() {
        // Add stub methods to match dom elements.
        (this.dayControl as any).setAttribute = () => {
        };
        (this.dayControl as any).removeAttribute = () => {
        };
        (this.monthControl as any).setAttribute = () => {
        };
        (this.monthControl as any).removeAttribute = () => {
        };
        (this.yearControl as any).setAttribute = () => {
        };
        (this.yearControl as any).removeAttribute = () => {
        };
        this.instance.refs = {
            day: this.dayControl,
            month: this.monthControl,
            year: this.yearControl
        };

        if (this.instance.yearRequired) {
            this.yearControl.addValidators(Validators.required);
        } else {
            this.yearControl.removeValidators(Validators.required);
        }
        if (this.instance.monthRequired) {
            this.monthControl.addValidators(Validators.required);
        } else {
            this.monthControl.removeValidators(Validators.required);
        }
        if (this.instance.dayRequired) {
            this.dayControl.addValidators(Validators.required);
        } else {
            this.dayControl.removeValidators(Validators.required);
        }
        this.yearControl.updateValueAndValidity();
        this.monthControl.updateValueAndValidity();
        this.dayControl.updateValueAndValidity();

        this.setDisabled(this.control.disabled);

        const dateFormatInfo = getLocaleDateFormatInfo(this.instance.options.language);
        this.dayFirst = this.component.useLocaleSettings
            ? dateFormatInfo.dayFirst
            : this.component.dayFirst;

        this.cdr.markForCheck();
    }

    getErrorMessage() {
        if (this.instance.error) {
            this.dayControl.setErrors({
                day: this.instance.error.message,
            });
            this.dayControl.markAsDirty();

            this.cdr.markForCheck();
        }
        return this.instance.error.message;
    }
}
