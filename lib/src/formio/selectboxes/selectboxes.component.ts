import { ChangeDetectionStrategy, Component, effect, viewChildren } from '@angular/core';
import { MaterialRadioComponent } from '../radio/radio.component';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { LabelComponent } from '../label/label.component';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Components } from '@formio/js';

// @ts-ignore
Components.components.selectboxes.prototype.setSelectedClasses = function () {};

@Component({
    selector: 'mat-formio-selectboxes',
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <div class="flex flex-col">
                @if (hasLabel) {
                    <mat-label>
                        <span [component]="component" matFormioLabel  [standalone]="true"></span>
                    </mat-label>
                }
                <div
                    class="flex gap-1"
                    [ngClass]="getLayout()"
                >
                    @for (option of component.values; track option) {
                        <mat-checkbox
                            [labelPosition]="getLabelPosition()"
                            (change)="onChange()"
                            [(ngModel)]="values[option.value]"
                            [disabled]="control.disabled"
                        >
                            {{ option.label | transloco }}
                        </mat-checkbox>
                    }
                    @if (instance().error) {
                        <mat-error class="text-error">{{ instance().error.message | transloco }}</mat-error>
                    }
                </div>
            </div>
        </ng-template>
    `,
    imports: [
        FormioFormFieldComponent,
        MatFormFieldModule,
        MatCheckboxModule,
        LabelComponent,
        NgClass,
        FormsModule,
        TranslocoPipe
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialSelectBoxesComponent extends MaterialRadioComponent {
    checkboxes = viewChildren(MatCheckbox)
    values = {}

    constructor() {
        super();

        effect(() => {
            this.initialize()
        });
    }

    getValue() {
        return this.values;
    }

    setValue(value: any) {
        if (this.instance()) {
            const normalizedValue = this.instance().normalizeValue(value);
            for (const prop in normalizedValue) {
                if (normalizedValue.hasOwnProperty(prop)) {
                    this.values[prop] = normalizedValue[prop];
                }
            }
        }
    }

    getLabelPosition() {
        return this.component.optionsLabelPosition === 'left' ? 'before' : 'after';
    }

    initialize() {
        if (this.instance()) {
            const _this = this;
            this.instance().checkComponentValidity = function (data, dirty, rowData, options, errors = []) {
                const minCount = this.component.validate.minSelectedCount;
                const maxCount = this.component.validate.maxSelectedCount;
                if (!this.shouldSkipValidation(data, rowData, options)) {
                    const isValid = this.isValid(data, dirty);
                    if ((maxCount || minCount)) {
                        const count = Object.keys(this.validationValue).reduce((total, key) => {
                            if (this.validationValue[key]) {
                                total++;
                            }
                            return total;
                        }, 0);

                        // Disable the rest of inputs if the max amount is already checked
                        if (maxCount && count >= maxCount) {
                            _this.checkboxes().forEach(checkbox => {
                                if (!checkbox.checked) {
                                    checkbox.setDisabledState(true);
                                }
                            })
                        } else if (maxCount && !this.shouldDisabled) {
                            _this.checkboxes().forEach(checkbox => {
                                if (!checkbox.checked) {
                                    checkbox.setDisabledState(false);
                                }
                            })
                        }

                        if ( maxCount && count > maxCount) {
                            const message = this.t(
                                this.component.maxSelectedCountMessage || 'You may only select up to {{maxCount}} items',
                                {maxCount}
                            );
                            this.errors.push({message});
                            this.setCustomValidity(message, dirty);
                            return false;
                        } else if ( minCount && count < minCount) {
                            this.setInputsDisabled(false);
                            const message = this.t(
                                this.component.minSelectedCountMessage || 'You must select at least {{minCount}} items',
                                {minCount}
                            );
                            this.errors.push({message});
                            this.setCustomValidity(message, dirty);
                            return false;
                        }
                    }
                }

                // @ts-ignore
                return Components.components.selectboxes.prototype.checkComponentValidity.call(this, data, dirty, rowData, options, errors = []);
            };
        }
    }
}
