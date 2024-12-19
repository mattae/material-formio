import { ChangeDetectionStrategy, Component, effect, signal, viewChild } from '@angular/core';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatSelectModule } from '@angular/material/select';
import { LabelComponent } from '../label/label.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatChipGrid, MatChipInput, MatChipOption, MatChipRemove } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconButton } from '@angular/material/button';
import { map, Observable, of, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';

Components.components.select.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
};

@Component({
    selector: 'mat-formio-select',
    template: `
        <mat-formio-form-field
                [component]="component"
                [componentTemplate]="componentTemplate"
        ></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            <mat-form-field class="w-full" [subscriptSizing]="'dynamic'">
                @if (hasLabel) {
                    <mat-label>
                        <span [component]="component" matFormioLabel></span>
                    </mat-label>
                }

                @if (component.prefix) {
                    <span matPrefix>
                        {{ component.prefix }}&nbsp;
                    </span>
                }
                @if (component.multiple) {
                    <mat-chip-grid #chipList>
                        @for (option of selectedOptions(); track option; let i = $index) {
                            <mat-chip-option
                                    [selectable]="true"
                                    [removable]="!control.disabled"
                                    (removed)="remove(option)"
                            >
                                <span [innerHTML]="option.label | transloco"></span>
                                <mat-icon matChipRemove svgIcon="heroicons_outline:backspace"></mat-icon>
                            </mat-chip-option>
                        }
                        <input
                                #autocompleteTrigger="matAutocompleteTrigger"
                                [formControl]="filterControl"
                                [matChipInputFor]="chipList"
                                [matAutocomplete]="auto"
                                matInput
                                #input
                        />
                    </mat-chip-grid>
                } @else {
                    <input
                            type="text"
                            matInput
                            #autocompleteTrigger="matAutocompleteTrigger"
                            [formControl]="control"
                            [matAutocomplete]="auto"
                            (focus)="openAuto()"
                            (input)="filterOptions($event)"
                    />
                }
                <mat-autocomplete
                        #auto="matAutocomplete"
                        [displayWith]="displayFn.bind(this)"
                >
                    @for (option of filteredOptions$ | async; track option.value; let i = $index) {
                        @if (component.multiple) {
                            <mat-option (click)="optionClicked($event, option)">
                                <div>
                                    <mat-checkbox
                                            [checked]="isSelected(option)"
                                            (change)="toggleSelection(option)"
                                            (click)="$event.stopPropagation()"
                                    >
                                    <span
                                            [innerHTML]="option.label | transloco"
                                    ></span>
                                    </mat-checkbox>
                                </div>
                            </mat-option>
                        } @else {
                            <mat-option
                                    [value]="option.value?.value || option.value"
                                    (click)="optionSelected(option)"
                            >
                                <span
                                        [innerHTML]="option.label | transloco"
                                ></span>
                            </mat-option>
                        }
                    }
                </mat-autocomplete>

                <button mat-icon-button matSuffix
                        (click)="openAuto()">
                    <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            width="24"
                            height="24"
                            class="text-primary"
                    >
                        <path d="M7 10l5 5 5-5H7z" />
                    </svg>

                </button>
                @if (component.description) {
                    <mat-hint>
                        <span [innerHTML]="component.description | transloco"></span>
                    </mat-hint>
                }
                @if (isError()) {
                    <mat-error>
                        {{ getErrorMessage() | transloco }}
                    </mat-error>
                }
            </mat-form-field>
        </ng-template>
    `,
    imports: [
        FormioFormFieldComponent,
        MatSelectModule,
        LabelComponent,
        ReactiveFormsModule,
        TranslocoModule,
        MatAutocompleteTrigger,
        MatAutocomplete,
        MatInput,
        MatChipGrid,
        MatChipInput,
        MatChipOption,
        MatChipRemove,
        MatIcon,
        MatCheckbox,
        MatIconButton,
        AsyncPipe
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialSelectComponent extends MaterialComponent {
    matACTrigger = viewChild(MatAutocompleteTrigger);
    chipInput = viewChild(MatInput)
    selectOptions = signal([]);
    selectedOptions = signal([]);
    filteredOptions$: Observable<any>;
    filterControl = new FormControl('');

    constructor() {
        super();

        effect(() => {
            if (this.instance()) {
                this.filteredOptions$ = this.filterControl.valueChanges.pipe(
                    startWith(''),
                    map(value => {
                        return value && typeof value === 'string' ? this.filter(value as string) : this.selectOptions().slice();
                    }),
                );
            }
        });
    }

    get values(): any[] | any {
        return this.control.value;
    }

    filterOptions(event: any) {
        const value = event.target.value;
        const filtered = value && typeof value === 'string' ? this.filter(value as string) : this.selectOptions().slice();
        this.filteredOptions$ = of(filtered);
    }

    filter(label: string) {
        return this.selectOptions().filter((option: any) => {
                return option.label?.toLowerCase().includes(label.toLowerCase())
            }
        );
    }

    getValue(): any[] | any {
        return this.control.value;
    }

    onChange(keepInputRaw?: boolean) {
        super.onChange(keepInputRaw);
        if (this.component.multiple) {
            this.#syncSelectedOptions();
        }
        this.cdr.markForCheck();
    }

    instanceInitialized(instance: any) {
        super.instanceInitialized(instance);

        this.instance().itemsLoadedResolve = () => {
            this.selectOptions.set(this.instance().selectOptions.map(option => {
                option.label = option.label.replace(/<\/?span>/g, '');
                return option;
            }));
        };
        this.instance().updateItems(null, true);
    }

    remove(option: any): void {
        if (option && this.values.length) {
            const index = this.values.findIndex((value: any) => option.value === value)
            this.values.splice(index, 1);
        }
        this.control.setValue(this.values);
        this.onChange();
    }

    displayFn(option: any) {
        return this.selectOptions()?.find(opt => opt.value === option)?.label ?? '';
    }

    optionClicked(event: Event, option: any) {
        event.stopPropagation();
        this.toggleSelection(option);
    }

    toggleSelection(option: any) {
        const values = this.values || [];
        const index = Array.isArray(values) && values.findIndex(value => option.value === value);
        if (values && index > -1) {
            values.splice(index, 1);
        } else {
            values.push(option.value);
        }
        this.control.setValue(values);
        this.chipInput().value = '';

        this.onChange();
    }

    isSelected(option: any): boolean {
        return this.values?.includes(option.value);
    }

    optionSelected(option: any) {
        this.control.patchValue(option?.value);
        this.onChange();
    }

    openAuto() {
        this.matACTrigger().openPanel();
    }

    #syncSelectedOptions() {
        const options = this.selectOptions();
        const selectedValues = this.values || [];
        const selected = options.filter((option) =>
            selectedValues.includes(option.value)
        );
        this.selectedOptions.set(selected);
    }
}
