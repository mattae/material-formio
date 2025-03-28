import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';
import _ from 'lodash';
import { Formio } from '@formio/angular';
import { LabelComponent } from '../label/label.component';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { NgClass } from '@angular/common';
import { MatIconButton } from '@angular/material/button';

Components.components.textfield.prototype.addAce = function (element, settings, onChange) {
    if (!settings || (settings.theme === 'snow')) {
        const mode = settings ? settings.mode : '';
        settings = {};
        if (mode) {
            settings.mode = mode;
        }
    }
    settings = _.merge(this.wysiwygDefault.ace, _.get(this.options, 'editors.ace.settings', {}), settings || {});
    return Formio.requireLibrary('ace', 'ace', _.get(this.options, 'editors.ace.src', `${Formio.cdn.ace}/ace.js`), true)
        .then((editor) => {
            editor = editor.edit(element);
            editor.removeAllListeners('change');
            delete settings.isUseWorkerDisabled;
            editor.setOptions(settings);
            editor.getSession().setMode(settings.mode);
            if (this.root.isEditor) {
                editor.on('blur', () => onChange(editor.getValue()));
            } else {
                editor.on('change', () => onChange(editor.getValue()));
            }
            if (settings.isUseWorkerDisabled) {
                editor.session.setUseWorker(false);
            }
            return editor;
        });
}

export const TEXTFIELD_TEMPLATE = `
    @if(component){
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <mat-form-field class="w-full" [ngClass]="{
                'formio-pdf': component.inPdf,
            }"
                [subscriptSizing]="'dynamic'">
                @if (hasLabel) {
                    <mat-label class="w-full">
                        <span [component]="component" matFormioLabel></span>
                    </mat-label>
                }
                @if (component.prefix && inputType !== 'currency') {
                    <span
                        matPrefix
                    >
                        {{ t(component.prefix) }}&nbsp;
                    </span>
                }
                <input matInput
                       type="{{ inputType }}"
                       [formControl]="control"
                       [placeholder]="t(component.placeholder)"
                       (blur)="onChange()"
                       (input)="onInput()"
                       #input
                >
                @if (component.suffix) {
                    <span matSuffix>{{ t(component.suffix) }}</span>
                }
                @if ( component.type === 'password') {
                    <button
                        (click)="input.type === 'password' ? input.type = 'text' : input.type = 'password'"
                        mat-icon-button
                        matSuffix
                        type="button">
                        @if (input.type === 'password') {
                            <mat-icon svgIcon="formio:visibility"></mat-icon>
                        }
                        @if (input.type === 'text') {
                            <mat-icon svgIcon="formio:visibility_off"></mat-icon>
                        }
                    </button>
                }
                @if (component.showWordCount || component.showCharCount || component.description) {
                    <mat-hint #hint>
                        <span [innerHTML]="t(getHint())"></span>
                    </mat-hint>
                }
                @if (isError()) {
                    <mat-error>{{ getErrorMessage() }}</mat-error>
                }
            </mat-form-field>
        </ng-template>
    }
    `;

@Component({
    selector: 'mat-formio-textfield',
    template: TEXTFIELD_TEMPLATE,
    imports: [
        MatFormFieldModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        LabelComponent,
        FormioFormFieldComponent,
        NgClass,
        MatIconButton
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTextfieldComponent extends MaterialComponent {
    public inputType = 'text';

    onInput() {
        if (!this.instance().root.isEditor) {
            this.onChange();
        }
    }

    getHint() {
        if (!this.control.value && !this.component.description) {
            return '';
        }

        if (_.get(this.component, 'showWordCount', false)) {
            const maxWords = _.parseInt(_.get(this.component, 'validate.maxWords', 0), 10);
            return this.getCounter(this.t('words'), this.getWordCount(), maxWords);
        }
        if (_.get(this.component, 'showCharCount', false)) {
            const maxChars = _.parseInt(_.get(this.component, 'validate.maxLength', 0), 10);
            return this.getCounter(this.t('characters'), (this.control.value ?? '').length, maxChars);
        }
        return this.component.description;
    }

    getWordCount() {
        const matches = this.control.value ? this.control.value.match(/[\w\d’'-]+/gi) : [];
        return matches ? matches.length : 0;
    }

    getCounter(type: string, count: number, max: number) {
        if (max) {
            const remaining = max - count;

            return this.t(`typeRemaining`, {
                remaining: remaining,
                type: type
            });
        } else {
            return this.t(`typeCount`, {
                count: count,
                type: type
            });
        }
    }
}
