import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@jsverse/transloco';
import { MatError, MatHint, MatSuffix } from '@angular/material/form-field';
import { LabelComponent } from '../label/label.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatRadioButton } from '@angular/material/radio';
import { MaterialRadioComponent } from '../radio/radio.component';
import _ from 'lodash';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'mat-formio-checkbox',
    template: `
        @if (component) {
            @if (component.inputType === 'radio') {
                @if (component.inPdf) {
                    <mat-checkbox
                            value="{{ component.value }}"
                            [checked]="isCheckboxChecked(component.value)"
                            (click)="clicked()"
                    >
                        @if (!component.labelIsHidden) {
                            {{ component.label }}
                        }
                    </mat-checkbox>
                } @else {
                    <mat-radio-button
                            [ngStyle]="{
                                zoom: '1.3'
                            }"
                            [name]="component.name"
                            value="{{ component.value }}"
                            [checked]="isRadioChecked(component.value)"
                            (click)="clicked()"
                    >
                        @if (!component.labelIsHidden) {
                            {{ component.label }}
                        }
                    </mat-radio-button>
                }
            } @else {
                <div class="flex flex-col">
                    <mat-checkbox (change)="onChange($event.checked)"
                                  [checked]="!!control.value"
                                  [disabled]="control.disabled"
                    >
                        @if (!component.labelIsHidden) {
                            <span matFormioLabel [component]="component"></span>
                        }
                    </mat-checkbox>
                    <mat-hint>
                        <span [innerHtml]="component.description | transloco"></span>
                    </mat-hint>
                    @if (isError()) {
                        <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                    }
                </div>
            }
        }
    `,
    imports: [
        MatCheckboxModule,
        TranslocoModule,
        MatError,
        MatHint,
        LabelComponent,
        MatIcon,
        MatSuffix,
        MatTooltip,
        MatRadioButton,
        NgStyle
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialCheckboxComponent extends MaterialRadioComponent {
    onChange(checked: boolean) {
        this.control.setValue(checked);
        super.onChange();
    }

    isRadioChecked(value: any) {
        return value === this.instance.dataValue;
    }

    isCheckboxChecked(value: any) {
        return value === this.instance.dataValue;
    }

    clicked(): void {
        this.control.setValue(this.component.value);
        _.set(this.instance.data, this.component.name, this.component.value)
        this.instance.updateValue(this.component.value, {
            modified: true
        });
    }
}
