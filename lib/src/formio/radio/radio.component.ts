import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgClass } from '@angular/common';
import { LabelComponent } from '../label/label.component';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';

// @ts-ignore
Components.components.radio.prototype.setSelectedClasses = function () {
}

@Component({
    selector: 'mat-formio-radio',
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <div class="flex-col flex">
                @if (hasLabel) {
                    <mat-label>
                        <span [component]="component" matFormioLabel [standalone]="true"></span>
                    </mat-label>
                }

                <mat-radio-group
                    (change)="onChange()"
                    [formControl]="control"
                    class="flex pl-2"
                    [ngClass]="getLayout()"
                >
                    @for (option of component.values; track tracked(option)) {
                        <mat-radio-button
                            value="{{ option.value }}"
                            [checked]="isRadioChecked(option)"
                            (keyup.space)="clearValue($event, option)"
                            (click)="clearValue($event, option)"
                        >
                            @if (!component.labelIsHidden) {
                                {{ option.label }}
                            }
                        </mat-radio-button>
                    }
                    @if ( component.description) {
                        <mat-hint>
                            <span [innerHTML]="component.description | transloco"></span>
                        </mat-hint>
                    }
                    @if (isError()) {
                        <mat-error class="text-sm">{{ getErrorMessage() | transloco }}</mat-error>
                    }
                </mat-radio-group>
            </div>
        </ng-template>
    `,
    imports: [
        FormioFormFieldComponent,
        MatFormFieldModule,
        LabelComponent,
        MatRadioModule,
        ReactiveFormsModule,
        NgClass,
        TranslocoPipe
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialRadioComponent extends MaterialComponent {
    getLayout() {
        return this.component.inline ? 'flex-row' : 'flex-col';
    }

    isRadioChecked(option: { value: any; }) {
        return option.value === this.instance.dataValue;
    }

    clearValue(event: { preventDefault: () => void; }, option: { value: any; }) {
        if (this.isRadioChecked(option)) {
            event.preventDefault();
            this.control.patchValue(null);
            this.onChange()
        }

        this.cdr.markForCheck()
    }

    tracked(option) {
        return option;
    }
}
