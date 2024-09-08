import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MaterialTextfieldComponent, TEXTFIELD_TEMPLATE } from '../textfield/textfield.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { TranslocoModule } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from "@angular/common";

@Component({
    selector: 'mat-formio-phonenumber',
    template: TEXTFIELD_TEMPLATE,
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
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialPhoneNumberComponent extends MaterialTextfieldComponent {
    public inputType = 'text';
}
