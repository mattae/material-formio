import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import _ from 'lodash';

const enum AngularButtonsThemes {
    WARN = 'bg-error text-on-error',
    PRIMARY = 'bg-primary text-on-tertiary',
    ACCENT = 'bg-secondary text-on-secondary'
}


const enum ButtonsThemes {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    INFO = 'info',
    WARNING = 'warning',
    DANGER = 'danger',
    SUCCESS = 'success'
}

@Component({
    selector: 'mat-formio-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.css'],
    imports: [
        NgClass,
        MatButtonModule,
        MatIconModule,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialButtonComponent extends MaterialComponent {
    loading = false;
    done = false;
    error = false;
    disabled = false;
    messageContainer = viewChild('messageContainer', {read: ElementRef});
    clicked = signal(false);
    message = signal<string>('');
    event = signal<string>('');
    hasError = signal(false);
    success = signal<boolean>(false);
    isValid: boolean;
    resultMessage = computed(() => {
        let message = 'Hello world';
        switch (this.event()) {
            case 'submitButton':
                this.setState(true, false, false);
                break;
            case 'submitDone':
                this.setState(false, false, true);
                message = this.message();
                break;
            case 'submitError':
                this.setState(false, true, false);
                message = this.message();
                break;
            case 'cancelSubmit':
                this.setState(false, false, true);
                break;
            case 'change':
                this.disabled = this.component.shouldDisabled;
                if (this.isValid) {
                    this.loading = false;
                    this.error = false;
                }

        }

        return message;
    });

    constructor() {
        super();
        effect(() => {
            if (this.component) {
                this.initialize()
            }
        });
    }

    get color() {
        if (this.error) {
            return AngularButtonsThemes.WARN;
        }
        const theme = this.angularButtonTheme;
        return theme || AngularButtonsThemes.PRIMARY;
    }

    get angularButtonTheme() {
        switch (this.component.theme) {
            case ButtonsThemes.PRIMARY:
                return AngularButtonsThemes.PRIMARY;

            case ButtonsThemes.WARNING:
                return AngularButtonsThemes.ACCENT;

            case ButtonsThemes.DANGER:
                return AngularButtonsThemes.WARN;

            default:
                return '';
        }
    }

    get buttonClass() {
        return this.angularButtonTheme;
    }

    onClick(event: any) {
        this.clicked.set(true);
        this.instance.onClick(event);
    }

    getValue() {
        return this.clicked;
    }

    setState(loading: boolean, error: boolean, done: boolean) {
        this.loading = loading;
        this.done = done;
        this.error = error;
    }

    initialize() {
        this.disabled = this.component.shouldDisabled;
        this.instance.on('submitButton', () => {
            this.event.set('submitButton');

            this.hasError.set(false);
            this.success.set(true);
            this.clicked.set(false);
        }, true);
        this.instance.on('cancelSubmit', () => {
            this.event.set('submitButton');

            this.hasError.set(false);
            this.success.set(false);
            this.clicked.set(false);
        }, true);
        this.instance.on('submitDone', (message: any) => {
            const resultMessage = _.isString(message) ? message : this.instance.t('complete');
            this.event.set('submitDone');

            this.hasError.set(false);
            this.success.set(true);
            this.message.set(resultMessage);
            this.clicked.set(false);
        }, true);
        this.instance.on('submitError', (message: any) => {
            const resultMessage = _.isString(message) ? this.instance.t(message) : this.instance.t(this.instance.errorMessage('submitError'));

            this.hasError.set(true);
            this.success.set(false);
            this.message.set(resultMessage);
            this.event.set('submitError');
            this.clicked.set(false);
        }, true);
        this.instance.on('change', (value: any, flags: any) => {
            let isValid = value.isValid;

            this.hasError.set(false);
            this.success.set(false);
            this.event.set('change');
            this.clicked.set(false);
        }, true);
    }

    messageClicked() {
        if (this.error && this.instance.root && this.instance.root.alert) {
            this.instance.scrollIntoView(this.instance.root.alert);
        }
    }
}
