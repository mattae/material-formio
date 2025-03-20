import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, computed, effect,
    ElementRef,
    EventEmitter,
    inject, input, model,
    OnInit,
    output,
    signal,
    viewChild
} from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { FormioModule, FormioRefreshValue } from '@formio/angular';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { FormioControl } from '../FormioControl';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgClass } from '@angular/common';
import { auditTime, Subject, throttleTime } from 'rxjs';

type DisplayObject = {
    display: string;
} & Record<string, unknown>;


@Component({
    selector: 'formio-builder',
    imports: [
        MatDrawer,
        MatDrawerContainer,
        MatDrawerContent,
        MatIcon,
        MatIconButton,
        FormioModule,
        MatFormField,
        MatSelect,
        MatOption,
        ReactiveFormsModule,
        MatCard,
        MatCardContent,
        NgClass
    ],
    styles: [
        `
            @use '@angular/material' as mat;

            :host {
                @apply w-full;
            }

            .display {
                @include mat.select-density(-5);
            }

            .flex1 {
                @apply flex;
            }
        `
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="relative inset-0 flex flex-col min-w-0 overflow-hidden w-full">
            <mat-drawer-container
                class="flex-auto h-full">
                <!-- Drawer -->
                <mat-drawer
                    class="w-180 sm:w-160 "
                    [mode]="drawerMode"
                    [opened]="false"
                    [position]="'end'"
                    #matDrawer>
                    <mat-card appearance="outlined" class="w-full">
                        <div class="">
                            <pre id="json"><code class="language-json" #json></code></pre>
                        </div>
                    </mat-card>
                </mat-drawer>

                <mat-drawer-content class="flex h-screen mat-app-background w-full">
                    <div class="flex-col flex w-full">
                        <div
                            class="flex flex-row justify-end gap-x-4 bg-surface-container rounded-md shadow-md pl-2 pr-2 mt-2 mb-2">
                            <button mat-icon-button (click)="togglePreview()">
                                <mat-icon svgIcon="formio:preview" [ngClass]="{
                                    'bg-primary text-on-primary': preview()
                                    }">
                                </mat-icon>
                            </button>
                            @if (preview()) {
                                <button mat-icon-button (click)="toggle()">
                                    <mat-icon svgIcon="formio:splitscreen" [ngClass]="{
                                    'bg-primary text-on-primary': !split()
                                    }">
                                    </mat-icon>
                                </button>
                            }
                            <div class="w-1/12">
                                <div class="display">
                                    <mat-form-field
                                        class="w-full"
                                        [subscriptSizing]="'dynamic'">
                                        <mat-select [formControl]="control">
                                            <mat-option [value]="'form'">Form</mat-option>
                                            <mat-option [value]="'pdf'">PDF</mat-option>
                                            <mat-option [value]="'wizard'">Wizard</mat-option>
                                        </mat-select>
                                    </mat-form-field>
                                </div>
                            </div>
                            <button
                                (click)="matDrawer.toggle()"
                                mat-icon-button>
                                <mat-icon [svgIcon]="'heroicons_outline:bars-3'"></mat-icon>
                            </button>
                        </div>
                        <div [ngClass]="componentsClasses()">
                            <div class="p-2" [ngClass]="{
                                'w-full': !split(),
                                'w-7/12': split()
                            }"
                            >
                                @if (display === 'pdf') {
                                    <form-builder [form]="pdf()" (change)="change($event)"
                                                  [rebuild]="refreshForm1"></form-builder>
                                } @else if (display === 'wizard') {
                                    <form-builder [form]="wizard()" (change)="change($event)"
                                                  [rebuild]="refreshForm1"></form-builder>
                                } @else {
                                    <form-builder [form]="formDisplay()" (change)="change($event)"
                                                  [rebuild]="refreshForm1"></form-builder>
                                }
                            </div>
                            @if (preview()) {
                                <div class="" [ngClass]="{
                                    'flex flex-row justify-end': !split(),
                                    'w-5/12': split()
                                    }">
                                    <div [ngClass]="{
                                        'w-10/12': !split()
                                        }">
                                        <div class="font-semibold text-center">
                                            Preview
                                        </div>
                                        <mat-card appearance="outlined">
                                            <mat-card-content>
                                                <formio [form]="currentForm" [refresh]="refreshForm"></formio>
                                            </mat-card-content>
                                        </mat-card>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </mat-drawer-content>
            </mat-drawer-container>
        </div>
    `
})
export class BuilderComponent implements OnInit {
    control = new FormioControl('form');
    split = signal(true);
    preview = model(true);
    drawerMode: 'side' | 'over';
    refreshForm: EventEmitter<FormioRefreshValue> = new EventEmitter();
    refreshForm1: EventEmitter<FormioRefreshValue> = new EventEmitter();
    jsonElement = viewChild('json', {read: ElementRef});
    formChanged = output<any>();
    form = input<DisplayObject>({display: ''});
    formDisplay = computed(() => ({...this.form(), ['display']: 'form'}));
    wizard = computed(() => ({...this.form(), ['display']: 'wizard'}));
    pdf = computed(() => ({...this.form(), ['display']: 'pdf'}));
    currentForm = {};
    #changeSubject = new Subject<any>();
    #changeDetectorRef = inject(ChangeDetectorRef);

    constructor() {
        this.#changeSubject.pipe(auditTime(3000)).subscribe(event => this.#processChange(event));
        effect(() => {
            if (this.form()) {
                const display = this.form().display;
                if (['form', 'pdf', 'wizard'].includes(display)) {
                    this.control.setValue(display);
                }

                this.currentForm = this.form();
                this.refreshForm.emit({
                    property: 'form',
                    value: this.form()
                });
                this.formChanged.emit(this.form());
            }
        });
    }

    get display() {
        return this.control.value;
    }

    ngOnInit() {
        this.control.valueChanges.subscribe(display => {
            this.refreshForm1.emit({
                property: 'form',
                value: ({
                    ...this.currentForm,
                    ['display']: display
                })
            });
            this.#changeDetectorRef.markForCheck();
        });
    }

    toggle() {
        this.split.update(prev => !prev);
    }

    togglePreview() {
        this.preview.update(prev => {
            if (prev) {
                this.split.set(false);
            } else {
                this.refreshForm.emit({
                    property: 'form',
                    value: this.currentForm
                });
            }
            return !prev;
        })
    }

    change(event: any) {
        this.#changeSubject.next(event);
    }

    componentsClasses() {
        return {
            'flex-row gap-x-2 flex1': this.split(),
            'flex flex-col': !this.split()
        }
    }

    #processChange(event: any) {
        this.jsonElement().nativeElement.innerHTML = '';
        this.jsonElement().nativeElement.appendChild(
            document.createTextNode(JSON.stringify(event.form, null, 4))
        );
        this.currentForm = event.form;
        this.refreshForm.emit({
            property: 'form',
            value: event.form,
        });

        this.formChanged.emit(event.form);

        this.#changeDetectorRef.markForCheck();
    }
}
