import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { LabelComponent } from '../label/label.component';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MaterialComponent } from '../material.component';
import { NgClass } from "@angular/common";
import { MatIconButton } from '@angular/material/button';
import { Components } from '@formio/js';
import _ from 'lodash';
import { Formio } from '@formio/angular';

const setInputMask = Components.components.textfield.prototype.setInputMask;
Components.components.textfield.prototype.setInputMask = function (...args) {
    try {
        setInputMask.call(this, args)
    }catch (e) {

    }
}

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
            editor.on('change', () => onChange(editor.getValue()));
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
                        {{ component.prefix | transloco}}&nbsp;
                    </span>
                }
                <input matInput
                       type="{{ inputType }}"
                       [formControl]="control"
                       [placeholder]="component.placeholder | transloco"
                       (blur)="onChange()"
                       (input)="onChange()"
                       #input
                >
                @if (component.suffix) {
                    <span matSuffix>{{ component.suffix | transloco }}</span>
                }
                @if ( component.type === 'password') {
                    <button
                        (click)="input.type === 'password' ? input.type = 'text' : input.type = 'password'"
                        mat-icon-button
                        matSuffix
                        type="button">
                        @if (input.type === 'password') {
                            <mat-icon svgIcon="mat_outline:visibility"></mat-icon>
                        }
                        @if (input.type === 'text') {
                            <mat-icon svgIcon="mat_outline:visibility_off"></mat-icon>
                        }
                    </button>
                }
                @if (component.showWordCount || component.showCharCount || component.description) {
                    <mat-hint>
                        <span [innerHTML]="getHint() | transloco"></span>
                    </mat-hint>
                }
                @if (isError()) {
                    <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
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
        TranslocoModule,
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

    getHint() {
        if (!this.control.value && !this.component.description) {
            return '';
        }

        const {showWordCount, showCharCount} = this.component;

        if (this.component.description) {
            return this.translocoService.translate(this.component.description)
        }
        if (showWordCount && showCharCount) {
            return this.translocoService.translate('CORE.FORMIO.TEXTFIELD.WORDS_CHARACTERS_COUNT', {
                words: this.getWordsCount(),
                characters: this.control.value.length
            });
        } else if (showWordCount) {
            return this.translocoService.translate('CORE.FORMIO.TEXTFIELD.WORDS_COUNT', {
                words: this.getWordsCount()
            });
        } else {
            return this.translocoService.translate('CORE.FORMIO.TEXTFIELD.CHARACTERS_COUNT', {
                characters: this.control.value.length
            });
        }
    }

    getWordsCount() {
        const matches = this.control.value ? this.control.value.match(/[\w\d’'-]+/gi) : [];
        return matches ? matches.length : 0;
    }
}
