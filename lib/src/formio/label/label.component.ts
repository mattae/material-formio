import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { MtxTooltip } from "@ng-matero/extensions/tooltip";

@Component({
    selector: 'span[matFormioLabel], label[matFormioLabel]',
    templateUrl: './label.component.html',
    styleUrls: ['./label.component.css'],
    imports: [
        MatIconModule,
        MatFormFieldModule,
        MatTooltipModule,
        TranslocoModule,
        NgClass,
        MtxTooltip,
    ],
    standalone: true,
})
export class LabelComponent {
    @Input()
    standalone = false

    _label: string

    @Input()
    set label(label: string) {
        this._label = label
    }

    get label() {
        return this._label || this.component?.label;
    }

    _component: any;

    @Input()
    set component(component: any) {
        this._component = component;
    }

    get component() {
        return this._component;
    }

    _required: boolean;
    @Input()
    set required(required: any) {
        if (required == 'true') {
            this._required = true
        }
    }

    get required() {
        if (this.component) {
            return this.component.validate?.required
        }
        return this._required;
    }

    @Input()
    tooltip: string;

    get styleClass() {
        return this.standalone ? 'mat-fio-label' : '';
    }
}
