import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LabelComponent } from '../label/label.component';
import { TranslocoModule } from '@jsverse/transloco';
import { DATETIME_TEMPLATE, MaterialDateComponent } from '../date/date.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
    MtxDatetimepicker,
    MtxDatetimepickerInput,
    MtxDatetimepickerToggle
} from '@ng-matero/extensions/datetimepicker';
import { provideLuxonDatetimeAdapter } from '@ng-matero/extensions-luxon-adapter';

@Component({
    selector: 'mat-formio-time',
    template: DATETIME_TEMPLATE,
    imports: [
        FormioFormFieldComponent,
        LabelComponent,
        MatFormFieldModule,
        MatDatepickerModule,
        MatIconModule,
        ReactiveFormsModule,
        MatInputModule,
        MtxDatetimepicker,
        MtxDatetimepickerInput,
        MtxDatetimepickerToggle,
        TranslocoModule
    ],
    providers: [
        provideLuxonDatetimeAdapter({
            parse: {
                dateInput: 'yyyy-LL-dd',
                monthInput: 'LLL',
                yearInput: 'yyyy',
                timeInput: 'HH:mm',
                datetimeInput: 'yyyy-LL-dd HH:mm',
            },
            display: {
                dateInput: 'dd LLL, yyyy',
                monthInput: 'LLL',
                yearInput: 'yyyy',
                timeInput: 'HH:mm',
                datetimeInput: 'dd LLL, yyyy HH:mm',
                monthYearLabel: 'yyyy LLL',
                dateA11yLabel: 'DDD',
                monthYearA11yLabel: 'LLL yyyy',
                popupHeaderDateLabel: 'dd LLL, ccc',
            }
        })
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTimeComponent extends MaterialDateComponent {

    constructor() {
        super();
        effect(() => {
            this.type = 'time'
        });
    }

    get enableDate() {
        return false;
    }

    get enableTime() {
        return true;
    }
}
