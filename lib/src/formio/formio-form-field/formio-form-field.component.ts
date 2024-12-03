import {
    Component,
    effect,
    ElementRef,
    Input,
    TemplateRef,
    viewChild,
    input,
    ChangeDetectionStrategy, inject, ChangeDetectorRef
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LabelComponent } from '../label/label.component';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'mat-formio-form-field',
    templateUrl: './formio-form-field.component.html',
    styleUrls: ['./formio-form-field.component.css'],
    imports: [
        NgClass,
        NgTemplateOutlet,
        MatFormFieldModule,
        LabelComponent,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormioFormFieldComponent {
    private _component;
    readonly labelTemplate = input<TemplateRef<any>>();
    readonly showDescription = input(true);
    readonly renderElementOnly = input(false);
    container = viewChild('container', {read: ElementRef});
    hideLabel = false;
    cdr = inject(ChangeDetectorRef)

    constructor() {
        effect(() => {
            if (this.container()) {
                const td = this.container()!.nativeElement.closest('td');
                this.hideLabel = !!(td && td.classList.contains('label-hidden'));

                this.componentTemplateContext = {$implicit: this.hasLabel()};
                this.cdr.markForCheck()
            }
        });
    }

    @Input('component')
    set component(instance) {
        this._component = instance;
        if (instance) {
            this.componentTemplateContext = {$implicit: this.hasLabel()};
        }
    }

    get component() {
        return this._component;
    }

    componentTemplate = input<TemplateRef<any>>();
    componentTemplateContext;

    hasLabel() {
        const component = this.component;
        const hasNoLabel = !component.label || component.hideLabel || this.component.labelIsHidden || this.hideLabel;

        return !(hasNoLabel || this.renderElementOnly());
    }
}
