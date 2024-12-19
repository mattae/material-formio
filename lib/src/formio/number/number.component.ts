import { ChangeDetectionStrategy, Component, effect, inject, Renderer2 } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { TranslocoModule } from '@jsverse/transloco'
import { MaterialTextfieldComponent, TEXTFIELD_TEMPLATE } from '../textfield/textfield.component';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { Components } from '@formio/js';
import { MatIconButton } from '@angular/material/button';

Components.components.number.prototype.focus = function () {}

@Component({
    selector: 'mat-formio-number',
    template: TEXTFIELD_TEMPLATE,
    imports: [
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        FormioFormFieldComponent,
        LabelComponent,
        TranslocoModule,
        MatIconModule,
        NgClass,
        MatIconButton
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialNumberComponent extends MaterialTextfieldComponent {
    public inputType = 'text';
    renderer = inject(Renderer2)

    constructor() {
        super();
        effect(() => {
            if (this.instance() && this.input()) {
                const {instance} = this;
                this.renderer.listen(this.input().nativeElement, 'blur', () => {
                    let value = instance().parseValue(this.control.value);
                    value = instance().formatValue(value);
                    value = instance().getValueAsString(value);
                    this.control.setValue(value);
                });
            }
        });
    }

    getValueAt(index: string) {
        if (!this.instance().refs.input.length || !this.instance().refs.input[index]) {
            return null;
        }

        const val = this.instance().refs.input[index].value;

        return val && val !== '-_' ? this.instance().parseNumber(val) : null;
    }

    onChange() {
        super.onChange( true);
    }
}
