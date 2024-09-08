import { ChangeDetectionStrategy, Component, effect, Input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';

const enum AngularButtonsThemes {
    WARN = 'mat-warn',
    PRIMARY = 'mat-primary',
    ACCENT = 'mat-accent'
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
    public loading = false;
    public done = false;
    public error = false;
    public disabled = false;
    public resultMessage: string | undefined = ''
    public clicked = false;
    @Input('valid')
    isValid: boolean;

    constructor() {
        super();
        effect(() => {
            if (this.component) {
                this.disabled = this.component.shouldDisabled;
                switch (this.event) {
                    case 'submitButton':
                        this.setState(true, false, false, '');
                        break;
                    case 'submitDone':
                        this.setState(false, false, true, this.message);
                        break;
                    case 'submitError':
                        this.setState(false, true, false, this.message);
                        break;
                    case 'cancelSubmit':
                        this.setState(false, false, true, '');
                        break;
                    case 'change':
                        this.disabled = this.component.shouldDisabled;
                        if (this.isValid) {
                            this.loading = false;
                            this.error = false;
                        }

                }
            }
        });
    }

    _message = signal<string>('');

    get message() {
        return this._message()
    }

    @Input()
    set message(message: any) {
        this._message.set(message)
    }

    _event = signal<string>('');

    get event() {
        return this._event()
    }

    @Input()
    set event(event: any) {
        this._event.set(event);
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
        let className = '';
        className += !this.angularButtonTheme ? ` mat-formio-theme-${this.component.theme}` : '';
        return className;
    }

    onClick(event: any) {
        this.clicked = true;
        this.formioEvent.emit({
            eventName: 'click',
            data: event
        }); // Should be called after this.value update
    }

    getValue() {
        return this.clicked;
    }

    setState(loading: boolean, error: boolean, done: boolean, message?: string) {
        this.loading = loading;
        this.done = done;
        this.error = error;
        this.resultMessage = message;
    }
}
