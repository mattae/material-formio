import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild } from '@angular/core';
import { MaterialComponent } from '../material.component';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { LabelComponent } from '../label/label.component';
import { MatInput } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIcon } from '@angular/material/icon';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import autocompleter from 'autocompleter';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
    selector: 'mat-formio-address',
    standalone: true,
    imports: [
        FormioFormFieldComponent,
        MatFormField,
        LabelComponent,
        MatInput,
        ReactiveFormsModule,
        TranslocoPipe,
        MatIcon,
        MatAutocomplete,
        MatOption,
        MatAutocompleteTrigger,
        AsyncPipe,
        MatError,
        MatHint,
        MatLabel,
        MatCheckbox,
        MatSuffix
    ],
    template: `
        <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
        <ng-template #componentTemplate let-hasLabel>
            @if (instance.autocompleteMode || control.disabled) {
            <mat-form-field class="w-full"
                            [subscriptSizing]="'dynamic'">
                @if (hasLabel) {
                    <mat-label class="w-full">
                        <span [component]="component" matFormioLabel></span>
                    </mat-label>
                }
                @if (component.prefix) {
                    <span
                            matPrefix
                    >
                        {{ component.prefix | transloco}}&nbsp;
                    </span>
                }
                <input matInput
                       [disabled]="control.disabled"
                       [placeholder]="component.placeholder | transloco"
                       #input
                >
                <button matIconSuffix (click)="input.value = ''">
                    <mat-icon svgIcon="heroicons_outline:backspace"></mat-icon>
                </button>
                @if ( component.description) {
                    <mat-hint>
                        <span [innerHTML]="component.description | transloco"></span>
                    </mat-hint>
                }
                @if (isError()) {
                    <mat-error>{{ getErrorMessage() | transloco }}</mat-error>
                }
            </mat-form-field>
            }
            @if (component.enableManualMode && !control.disabled && !instance.isMultiple) {
                <fieldset class="border border-solid border-gray-300 p-3 rounded-lg">
                    @if (hasLabel && manualMode) {
                        <legend class="text-md">
                        <mat-label class="w-full">
                            <span [component]="component" matFormioLabel [standalone]="true"></span>
                        </mat-label>
                        </legend>
                    }
                    <mat-checkbox (change)="modeChanged(checkbox.checked)"
                                  [checked]="manualMode" #checkbox>
                        {{component.switchToManualModeLabel}}
                    </mat-checkbox>
                    <div class="flex flex-col" #children>
                    </div>
                </fieldset>
            }
        </ng-template>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialAddressComponent extends MaterialComponent {
    children = viewChild('children', {read: ElementRef})
    provider: any;
    manualMode: boolean = false;

    constructor() {
        super();
        effect(() => {
            if(this.instance) {
                this.initialize();
            }
        })
    }

    initialize() {
        this.provider = this.instance.provider;
        this.manualMode = this.instance.dataValue?.mode === 'manual';

        if(this.children()) {
            this.children()!.nativeElement.innerHTML = this.instance.renderComponents();
            this.instance.attachComponents(this.children()!.nativeElement);
        }

        if (this.input()) {
            this.updateDisplayValue();

            if (this.component.provider === 'google' && this.provider) {
                this.provider.attachAutocomplete(this.input().nativeElement, 0, this.onSelectAddress.bind(this));
            } else {
                autocompleter({
                    input: this.input().nativeElement,
                    debounceWaitMs: 300,
                    fetch: (text, update) => {
                        this.provider.search(text).then(update);
                    },
                    render: (address) => {
                        const div = this.instance.ce('div');
                        div.textContent = this.instance.getDisplayValue(address);
                        return div;
                    },
                    onSelect: (address) => {
                        this.onSelectAddress(address);
                    },
                });
            }
        }
    }

    onSelectAddress (address: any) {
        const index = this.getIndex()
        if (this.instance.isMultiple) {
            this.instance.address[index] = address;
            this.instance.address = [...this.instance.address];
        }
        else {
            this.instance.address = address;
        }
        this.control.setValue(this.instance.address);
        this.input().nativeElement.value = this.instance.getDisplayValue(this.instance.isMultiple ?
            this.instance.address[index] : this.instance.address);

        this.instance.triggerChange({
            modified: true,
        });
    }

    modeChanged(checked: boolean) {
        this.manualMode = checked;
        if (this.instance.manualModeEnabled) {
            this.instance.dataValue.mode = checked ? 'manual': 'autocomplete';

            if (!this.instance.builderMode) {
                if (this.instance.manualMode) {
                    this.instance.restoreComponentsContext();
                }

                this.instance.triggerChange({
                    modified: true,
                });
            }
        }
    }

    updateDisplayValue() {
        let value = this.instance.dataValue;
        if (this.instance.isMultiple) {
            value = value[this.getIndex()]
        }
        this.input().nativeElement.value = this.instance.getValueAsString(value);
    }
}
