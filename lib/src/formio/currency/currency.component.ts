import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TEXTFIELD_TEMPLATE } from '../textfield/textfield.component';
import { MaterialNumberComponent } from '../number/number.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { TranslocoModule } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from "@angular/common";

@Component({
    selector: 'mat-formio-currency',
    template: TEXTFIELD_TEMPLATE,
    standalone: true,
    imports: [
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        FormioFormFieldComponent,
        LabelComponent,
        TranslocoModule,
        MatIconModule,
        NgClass
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialCurrencyComponent extends MaterialNumberComponent {
    public inputType = 'text';
}
