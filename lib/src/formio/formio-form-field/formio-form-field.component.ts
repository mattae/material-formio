import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    ElementRef,
    inject,
    Input,
    input,
    TemplateRef,
    viewChild
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'mat-formio-form-field',
    templateUrl: './formio-form-field.component.html',
    styleUrls: ['./formio-form-field.component.css'],
    imports: [
        NgTemplateOutlet,
        MatFormFieldModule,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormioFormFieldComponent {
    readonly labelTemplate = input<TemplateRef<any>>();
    readonly showDescription = input(true);
    readonly renderElementOnly = input(false);
    container = viewChild('container', {read: ElementRef});
    hideLabel = false;
    cdr = inject(ChangeDetectorRef)
    componentTemplate = input<TemplateRef<any>>();
    componentTemplateContext;

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

    private _component;

    get component() {
        return this._component;
    }

    @Input('component')
    set component(instance) {
        this._component = instance;
        if (instance) {
            this.componentTemplateContext = {$implicit: this.hasLabel()};
        }
    }

    hasLabel() {
        const component = this.component;
        const hasNoLabel = !component.label || component.hideLabel || this.component.labelIsHidden || this.hideLabel;

        return !(hasNoLabel || this.renderElementOnly());
    }
}
