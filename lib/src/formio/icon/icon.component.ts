import { Component, input, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';

@Component({
    selector: 'fio-icon',
    standalone: true,
    imports: [
        MatIcon,
        MatIconButton,
        MatButton,
        MatMiniFabButton
    ],
    template: `
        @if (iconButton) {
            @if (fab) {
                <button mat-mini-fab [class]="classNames">
                    <mat-icon [svgIcon]="icon"></mat-icon>
                </button>
            } @else {
                <button mat-icon-button [class]="classNames">
                    <mat-icon [svgIcon]="icon" [class]="iconClasses"></mat-icon>
                </button>
            }
        } @else if (button) {
            <button
                type="button"
                mat-raised-button
                [class]="classNames"
                [color]="color"
            >
                @if (icon) {
                    <mat-icon [svgIcon]="icon" [class]="iconClasses"></mat-icon>
                }
                @if (label) {
                    {{ label }}
                }
            </button>
        } @else {
            <mat-icon [svgIcon]="icon" [class]="iconClasses"></mat-icon>
        }
    `
})
export class MaterialIconComponent {
    _color: string;
    @Input()
    icon: string;
    @Input()
    fab: boolean;
    @Input('iconbutton')
    iconButton: boolean
    @Input()
    button: boolean
    @Input()
    label: string
    @Input('classnames')
    classNames: string;
    @Input("iconclasses")
    iconClasses: string;
    @Input()
    set color(color: string) {
        if (color === 'primary' || color === 'secondary' || color === 'warn') {
            this._color = color;
        }
    }
    get color() {
        return this._color;
    }
}
