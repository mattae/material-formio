import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
    MtxCalendarView,
    MtxDatetimepicker,
    MtxDatetimepickerFilterType,
    MtxDatetimepickerInput,
    MtxDatetimepickerMode,
    MtxDatetimepickerToggle,
    MtxDatetimepickerType
} from '@ng-matero/extensions/datetimepicker';
import { DateTime } from 'luxon';
import { provideLuxonDatetimeAdapter } from '@ng-matero/extensions-luxon-adapter';
import { TranslocoPipe } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import _ from 'lodash';
import { FormioUtils } from '@formio/angular';
import _CalendarWidget from 'formiojs/widgets/CalendarWidget';

const CalendarWidget = _CalendarWidget['default'] || _CalendarWidget;

CalendarWidget.prototype.initFlatpickr = function (arg) {}

export const DATETIME_TEMPLATE = `
    @if (component) {
            <mat-formio-form-field [component]="component"
                                   [componentTemplate]="componentTemplate"></mat-formio-form-field>
            <ng-template #componentTemplate let-hasLabel>
                <mat-form-field class="w-full"
                [subscriptSizing]="'dynamic'">
                    @if (hasLabel) {
                        <mat-label class="w-full">
                            <span [component]="component" matFormioLabel></span>
                        </mat-label>
                    }
                    <mtx-datetimepicker #datetimePicker
                                        [type]="type"
                                        [mode]="mode"
                                        [multiYearSelector]="multiYearSelector"
                                        [startView]="startView"
                                        [twelvehour]="twelvehour"
                                        [timeInterval]="timeInterval"
                                        [timeInput]="timeInput">
                    </mtx-datetimepicker>
                    <input [mtxDatetimepicker]="datetimePicker"
                           [placeholder]="component.placeholder"
                           [mtxDatetimepickerFilter]="dateFilter"
                           [min]="minDate"
                           [max]="maxDate"
                           (focus)="datetimePicker.open();"
                           (dateChange)="onChange()"
                           [formControl]="control" matInput>
                    <mtx-datetimepicker-toggle [for]="datetimePicker" matSuffix></mtx-datetimepicker-toggle>
                    @if (component.description) {
                        <mat-hint>
                            <span [innerHTML]="component.description | transloco"></span>
                        </mat-hint>
                    }
                    @if (isError()) {
                        <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                    }
                </mat-form-field>
            </ng-template>
        }
`

@Component({
    selector: 'mat-formio-date',
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
        TranslocoPipe
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

export class MaterialDateComponent extends MaterialComponent {
    type: MtxDatetimepickerType = 'datetime';
    mode: MtxDatetimepickerMode = 'auto';
    startView: MtxCalendarView = 'month';
    multiYearSelector = true;
    twelvehour = false;
    timeInterval = 1;
    timeInput = true;

    constructor() {
        super();
        effect(() => {
            if (this.instance) {
                this.initialize();
            }
        });
    }

    initialize() {
        if (this.enableTime && this.enableDate) {
            this.type = 'datetime'
        }
        if (this.enableTime && !this.enableDate) {
            this.type = 'time'
        }
        if (!this.enableTime && this.enableDate) {
            this.type = 'date'
        }

        this.twelvehour = _.get(this.component, 'timePicker.showMeridian', false);
        this.timeInterval = _.get(this.component, 'timePicker.minuteStep', 5);

        if (!this.instance.defaultValue && this.component.defaultDate) {
            let defaultValue = FormioUtils.getDateSetting(this.component.defaultDate);
            if (defaultValue) {
                this.control.setValue(DateTime.fromJSDate(defaultValue));
            }
        }
    }

    setValue(value: any) {
        this._value = value;
        if (this._value && this.component) {
            if (typeof value === 'string') {
                let val: DateTime | undefined = undefined;
                if (this.enableTime && !this.enableDate) {
                   val = DateTime.fromFormat(value, 'HH:mm');
                }
                else {
                    val = DateTime.fromJSDate(new Date(value));
                }
                if (val.isValid) {
                    value = val;
                }
            }
            if (this.dateFilter(value, this.filterType) && this.checkMinMax(value)) {
                value = this.formatValue(value);
                this.control.setValue(value)
                this.instance.dataValue = value;
                this.instance.triggerChange({
                    modified: true,
                });
            }
        }
    }

    getValue() {
        return this._value;
    }

    get maxDate() {
        const maxDate = _.get(this.component, 'datePicker.maxDate');
        return maxDate ? DateTime.fromJSDate(FormioUtils.getDateSetting(maxDate)!) : null
    }

    get minDate() {
        const minDate = _.get(this.component, 'datePicker.minDate');
        return minDate ? DateTime.fromJSDate(FormioUtils.getDateSetting(minDate)!) : null
    }

    get enableDate() {
        return this.component.enableDate !== false;
    }

    get enableTime() {
        return _.get(this.component, 'enableTime', true)
    }

    get filterType() {
        return this.enableDate ? MtxDatetimepickerFilterType.DATE : MtxDatetimepickerFilterType.HOUR;
    }

    onChange() {
        const _value = this.control.value;
        let value = this.enableDate ? this.dateFilter(_value, this.filterType) && this.checkMinMax(_value) ? _value : '' : _value;
        if (value) {
           value = this.formatValue(value);
           this.control.patchValue(value);
           this.instance.dataValue = value;
           this.instance.triggerChange({
                modified: true
           });
        }
    }

    formatValue(value: any) {
        if (typeof value !== 'object') {
            return '';
        }
        let val: string| null = '';
        if (!this.enableDate) {
            val = (value as DateTime).toISOTime({
                suppressMilliseconds: true,
                suppressSeconds: true,
                includeOffset: false,
                includePrefix: false
            })
        }
        if (!this.enableTime) {
            val = (value as DateTime).toISODate()
        }
        if (this.enableTime && this.enableDate) {
            val = (value as DateTime).toISO({includeOffset: false})
        }

        return val;
    }

    checkMinMax(value: DateTime) {
        let isValid = true;

        if (this.minDate) {
            isValid = value.startOf('hour') >= this.minDate.startOf('hour');
        }
        if (this.maxDate && isValid) {
            isValid = value.startOf('hour') <= this.maxDate.startOf('hour');
        }
        return isValid;
    }

    disableWeekends(d: DateTime | null) {
        if (d) {
            return d.weekday < 6;
        }
        return true;
    }

    disableWeekdays(d: DateTime | null) {
        if (d) {
            return d.weekday > 5;
        }
        return true;
    }

    disableDates(dates: Array<string>, d: DateTime | null) {
        const formattedDates = dates.map((date) => DateTime.fromISO(date).toFormat('YYYY-MM-DD'));
        return d && !formattedDates.includes(d.toFormat('YYYY-MM-DD'));
    }

    dateFilter = (d: DateTime | null, type: MtxDatetimepickerFilterType): boolean => {
        if (type !== MtxDatetimepickerFilterType.DATE) {
            return true
        }
        let isValid = this.component.datePicker?.disableWeekends ? this.disableWeekends(d) : true;
        isValid &&= this.component.datePicker?.disableWeekdays ? this.disableWeekends(d) : true;
        // @ts-ignore
        return this.component.widget.disabledDates && isValid ?
            this.disableDates(this.component.widget.disabledDates.split(','), d) : isValid;
    }

    get disableFunction() {
        return (date) => this.instance.evaluate(`return ${_.get(this.component, 'datePicker.disableFunction')}`, {
            date
        });
    }
}
