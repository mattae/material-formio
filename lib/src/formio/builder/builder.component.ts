import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    inject,
    OnInit,
    signal,
    ViewChild
} from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { FormioModule, FormioRefreshValue } from '@formio/angular';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormioControl } from '../FormioControl';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'formio-builder',
    imports: [
        MatDrawer,
        MatDrawerContainer,
        MatDrawerContent,
        MatIcon,
        MatIconButton,
        MatLabel,
        FormioModule,
        MatFormField,
        MatSelect,
        MatOption,
        TranslocoPipe,
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
    standalone: true,
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
                        <div class="flex flex-row justify-end gap-x-4 bg-surface rounded-md shadow-md pl-2 pr-2 mt-2 mb-2">
                            <button mat-icon-button [ngClass]="{
                                'bg-primary text-on-primary': !split()
                            }" (click)="toggle()"
                            >
                                <mat-icon svgIcon="mat_outline:splitscreen"></mat-icon>
                            </button>
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
                            <div [ngClass]="{
                                'w-full': !split(),
                                'w-1/2': split()
                            }"
                            >
                                <form-builder [form]="form()" (change)="change($event)"
                                              [rebuild]="refreshForm1"></form-builder>
                            </div>
                            <div class="" [ngClass]="{
                                'flex flex-row justify-end': !split(),
                                'w-1/2': split()
                            }"
                            >
                                <div [ngClass]="{
                                    'w-10/12': !split()
                                }"
                                >
                                    <div class="font-semibold text-center">
                                        Preview
                                    </div>
                                    <mat-card appearance="outlined">
                                        <mat-card-content>
                                            <formio [form]="form()" [refresh]="refreshForm"></formio>
                                        </mat-card-content>
                                    </mat-card>
                                </div>
                            </div>
                        </div>
                    </div>
                </mat-drawer-content>
            </mat-drawer-container>
        </div>
    `
})
export class BuilderComponent implements OnInit {
    control = new FormioControl('form');
    form = signal({});
    split = signal(false);
    drawerMode: 'side' | 'over';
    refreshForm: EventEmitter<FormioRefreshValue> = new EventEmitter();
    refreshForm1: EventEmitter<FormioRefreshValue> = new EventEmitter();
    @ViewChild('json', {static: true}) jsonElement?: ElementRef;
    @ViewChild('code', {static: true}) codeElement?: ElementRef;
    #changeDetectorRef = inject(ChangeDetectorRef);

    ngOnInit() {
        this.control.valueChanges.subscribe(display => {
            this.form.update(prev => ({
                ...prev,
                ['display']: display
            }));

            this.refreshForm1.emit({
                property: 'form',
                value: ({
                    ...this.form(),
                    ['display']: display
                })
            });

            this.#changeDetectorRef.markForCheck();
        });
    }

    toggle() {
        this.split.update(prev => !prev);
    }

    change(event: any) {
        this.jsonElement.nativeElement.innerHTML = '';
        this.jsonElement.nativeElement.appendChild(document.createTextNode(JSON.stringify(event.form.components, null, 4)));
        //this.form.set(event.form);
        this.refreshForm.emit({
            property: 'form',
            value: event.form
        });
    }

    componentsClasses() {
        return {
            'flex-row gap-x-2 flex1': this.split(),
            'flex flex-col': ! this.split()
        }
    }
}
