import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { MaterialComponent } from "../material.component";

@Component({
    selector: 'mat-formio-survey',
    template: `
        @if (component) {
            <mat-formio-form-field [component]="component"
                                   [componentTemplate]="componentTemplate"></mat-formio-form-field>
            <ng-template #componentTemplate let-hasLabel>
                <div class="pb-3">
                    <table class="border-collapse table-auto border w-full h-full p-4 border-slate-400">
                        <thead class="bg-primary-container">
                        <tr>
                            <th class="border border-on-tertiary-container">
                                @if (hasLabel) {
                                    <h4>
                                        <span [component]="component" matFormioLabel></span>
                                    </h4>
                                }
                            </th>
                            @for (value of component.values; track value) {
                                <th class="text-on-primary-container font-semibold p-4 border border-on-tertiary-container"
                                >
                                    {{ value.label | transloco }}
                                </th>
                            }
                        </tr>
                        </thead>

                        <tbody>
                            @for (question of component.questions; track question; let i = $index, e = $even) {
                                <tr [ngClass]="{'bg-tertiary-container text-on-tertiary-container': e, 'text-primary': !e}">
                                    <td class="border border-slate-300 dark:border-slate-700 pl-1.5 ">{{ question.label | transloco }}</td>
                                    @for (value of component.values; track value; let j = $index) {
                                        <td class="border border-slate-300 dark:border-slate-700"
                                        >
                                            <div class="flex items-center justify-center">
                                                <mat-radio-group (change)="onChange()"
                                                                 [formControl]="getFormControl(question.value)"
                                                                 [name]="getUniqueName(question.value)"
                                                >
                                                    <mat-radio-button [value]="value.value"></mat-radio-button>
                                                </mat-radio-group>
                                            </div>
                                        </td>
                                    }
                                </tr>
                            }
                            @if (component.description) {
                                <mat-hint class="mat-formio-component-description">
                                    {{ component.description | transloco }}
                                </mat-hint>
                            }
                        </tbody>
                        @if (isError()) {
                            <mat-error>{{ instance.error.message | transloco }}</mat-error>
                        }
                    </table>
                </div>
            </ng-template>
        }
    `,
    imports: [
        FormioFormFieldComponent,
        LabelComponent,
        MatRadioModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoModule,
        NgClass
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialSurveyComponent extends MaterialComponent {
    public controls: any = {};

    getFormControl(question: string) {
        if (!this.controls[question]) {
            this.controls[question] = new FormControl();
            if (this.component.shouldDisabled) {
                this.controls[question].disable();
            }
        }
        return this.controls[question];
    }

    setDisabled(disabled: any) {
        const method = disabled ? 'disable' : 'enable';
        for (const question in this.controls) {
            if (this.controls.hasOwnProperty(question)) {
                this.controls[question][method]();
            }
        }
    }

    getValue() {
        const values = {};
        for (const question in this.controls) {
            if (this.controls.hasOwnProperty(question)) {
                values[question] = this.controls[question].value || false;
            }
        }
        return values;
    }

    setValue(value: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) {
        for (const question in value) {
            if (value.hasOwnProperty(question)) {
                const control = this.getFormControl(question);
                if (control) {
                    control.setValue(value[question] || false);
                }
            }
        }
    }

    getUniqueName(question: any) {
        return `${this.component.id}-${question}`;
    }
}
