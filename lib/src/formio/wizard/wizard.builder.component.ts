import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MaterialWebBuilderComponent } from '../web-builder/web-builder.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgClass, NgStyle } from '@angular/common';
import { MatChip, MatChipAvatar, MatChipGrid, MatChipOption, MatChipSet } from '@angular/material/chips';

@Component({
    selector: 'mat-formio-wizard-builder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatFormField,
        MatIcon,
        MatIconButton,
        MatInput,
        TranslocoPipe,
        NgStyle,
        NgClass,
        MatChipSet,
        MatChip,
        MatChipOption,
        MatChipAvatar,
        MatChipGrid
    ],
    template: `
        @if (component) {
            <div class="flex flex-col">
                <div class="flex flex-row">
                    <div class="w-2/12">
                        <div>
                            <mat-form-field class="w-full" [subscriptSizing]="'dynamic'" [ngStyle]="{
                            zoom: '0.7'
                        }">
                                <input matInput #search placeholder="Search field(s)">
                                <button
                                        mat-icon-button
                                        matSuffix
                                        type="button">
                                    <mat-icon svgIcon="mat_outline:search"></mat-icon>
                                </button>
                            </mat-form-field>
                            <mat-accordion>
                                @for (groupOrder of groupOrders; track groupOrder) {
                                    <mat-expansion-panel [expanded]="instance.groups[groupOrder].default">
                                        <mat-expansion-panel-header>
                                            {{ instance.groups[groupOrder].title | transloco }}
                                        </mat-expansion-panel-header>
                                        <div [attr.ref]="'sidebar-container'" #sidebarContainer>
                                            @if (componentOrders[groupOrder].length) {
                                                @for (componentOrder of componentOrders[groupOrder]; track componentOrder) {
                                                    <div class="pt-1.5 drag-copy"
                                                         #sidebarComponent
                                                         [attr.data-group]="groupOrder"
                                                         [attr.data-key]="instance.groups[groupOrder].components[componentOrder].key"
                                                         [attr.data-type]="instance.groups[groupOrder].components[componentOrder].schema.type"
                                                         tabindex="{{instance.keyboardActionsEnabled ? 0 : -1}}">
                                                        <div
                                                                class="pl-2 space-x-0.5 flex items-center justify-items-end bg-primary shadow-lg rounded-md h-10">
                                                            <mat-icon class="text-on-primary icon-size-4"
                                                                      [svgIcon]="instance.groups[groupOrder].components[componentOrder].icon ? iconClass('', instance.groups[groupOrder].components[componentOrder].icon) : 'feather:copy'">
                                                            </mat-icon>
                                                            <div class="ml-1.5 leading-5 mr-auto pl-1 text-on-primary">
                                                                {{ instance.groups[groupOrder].components[componentOrder].title }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            } @else {
                                                {{ 'No matches found' | transloco }}
                                            }
                                        </div>
                                    </mat-expansion-panel>
                                }
                            </mat-accordion>
                        </div>
                    </div>
                    <div class="w-10/12 pl-2">
                        <div class="breadcrumb wizard-pages pl-4">
                            <mat-chip-grid>
                                @for (page of instance.pages; track page; let pageIndex = $index) {
                                    <mat-chip-option [id]="page.key" (click)="setPage(pageIndex)"
                                    [ngClass]="{
                                        'bg-primary-container text-on-primary-container': instance.page === pageIndex,
                                        'bg-secondary-container text-on-secondary-container': instance.page !== pageIndex
                                    }">{{page.title}}</mat-chip-option>
                                }
                                <mat-chip-option [title]="instance.t('Create Page')" (click)="addPage()">
                                    <mat-icon matChipAvatar svgIcon="heroicons_outline:plus-circle"></mat-icon>
                                    {{instance.t('Page')}}
                                </mat-chip-option>
                            </mat-chip-grid>
                        </div>
                        <div [attr.ref]="'form'" #form>
                        </div>
                    </div>
                </div>
            </div>
        }
    `
})
export class MaterialWizardBuilderComponent extends MaterialWebBuilderComponent {
    addPage() {
        this.instance.addPage();
    }

    setPage(index: number) {
        this.instance.setPage(index);
    }
}
