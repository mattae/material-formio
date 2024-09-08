import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';

@Component({
    selector: 'mat-formio-tags',
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <mat-form-field class="example-chip-list w-full h-full">

                @if (hasLabel) {
                    <mat-label>
                        <span [component]="component" matFormioLabel></span>
                    </mat-label>
                }

                <mat-chip-grid #chipList [attr.aria-label]="component.label | transloco">
                    @for (tag of tags; track tag; let i = $index) {
                        <mat-chip-option
                            [selectable]="true"
                            [removable]="!control.disabled"
                            (removed)="remove(i)"
                        >
                            {{ tag | transloco }}
                            <mat-icon matChipRemove svgIcon="heroicons_outline:backspace"></mat-icon>
                        </mat-chip-option>
                    }

                    <input [formControl]="control"
                           [matChipInputFor]="chipList"
                           [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                           [matChipInputAddOnBlur]="true"
                           (matChipInputTokenEnd)="add($event)"
                    >
                </mat-chip-grid>
            </mat-form-field>
        </ng-template>
    `,
    standalone: true,
    imports: [
        FormioFormFieldComponent,
        MatChipsModule,
        LabelComponent,
        MatIconModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        TranslocoModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTagsComponent extends MaterialComponent {
    readonly separatorKeysCodes: number[] = [ENTER, COMMA];
    tags: string[] = [];

    add(event: MatChipInputEvent): void {
        const input = event.chipInput.inputElement;
        const value = event.value;
        if ((value || '').trim()) {
            this.tags.push(value.trim());
        }
        if (input) {
            input.value = '';
        }
        this.onChange();
    }

    remove(index: number): void {
        if (index >= 0 && index < this.tags.length) {
            this.tags.splice(index, 1);
        }
        this.onChange();
    }

    setValue(value: any) {
        if (this.component.storeas === 'string') {
            this.tags = []
            this.tags = value.split(this.component.delimiter || ',')
        } else if (this.component.storeas !== 'string' && Array.isArray(value)) {
            this.tags = []
            this.tags.push(...value)
        }
    }

    getValue(): any | string {
        return (this.component.storeas === 'string') ? this.tags.join(this.component.delimiter || ',') : this.tags;
    }
}
