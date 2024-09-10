import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatInputModule } from '@angular/material/input';
import { NgClass } from '@angular/common';
import { LabelComponent } from '../label/label.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialTextfieldComponent } from '../textfield/textfield.component';
import { Components } from 'formiojs';
import _BaseComponent from 'formiojs/components/_classes/component/Component';

const BaseComponent = _BaseComponent['default'] || _BaseComponent;

Components.components.textarea.prototype.render = function (...args) {
    return BaseComponent.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-textarea',
    styleUrls: ['./textarea.component.css'],
    encapsulation: ViewEncapsulation.None,
    template: `
        @if (component) {
            <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
            <ng-template #componentTemplate let-hasLabel>
                <mat-form-field class="mat-formio-textarea w-full h-full self-center"
                                [subscriptSizing]="'dynamic'"
                                [ngClass]="{'editor-enabled': !!component.editor}"
                >
                    @if (hasLabel) {
                        <mat-label class="w-full">
                            <span [component]="component" matFormioLabel></span>
                        </mat-label>
                    }
                    @if (component.prefix) {
                        <span matPrefix>{{ component.prefix | transloco }}&nbsp;</span>
                    }
                    <textarea matInput
                              class="w-full"
                              [placeholder]="component.placeholder"
                              [formControl]="control"
                              [rows]="(component.rows || 3)"
                              (input)="onChange()"
                              #textarea
                    >
                    </textarea>
                    @if (component.suffix) {
                        <span matSuffix>{{ component.suffix | transloco }}</span>
                    }
                    @if ( component.description) {
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
    `,
    imports: [
        FormioFormFieldComponent,
        MatInputModule,
        LabelComponent,
        NgClass,
        ReactiveFormsModule,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTextareaComponent extends MaterialTextfieldComponent {
}

