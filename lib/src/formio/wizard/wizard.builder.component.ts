import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MaterialWebBuilderComponent} from '../web-builder/web-builder.component';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {MatFormField} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {NgClass, NgStyle} from '@angular/common';
import {MatChipAvatar, MatChipOption, MatChipSet} from '@angular/material/chips';
import {Displays, Utils} from '@formio/js';
import _ from 'lodash';
import {MatCard, MatCardContent} from '@angular/material/card';
import uniqueKey = Utils.uniqueKey;

const Wizard = Displays.getDisplay('wizard');

Wizard.prototype.setComponentSchema = function () {
    const pageKeys = {};
    this.originalComponents = [];
    this.component.components = this.component.components || [];
    this.component.components.map((item) => {
        if (item.type === 'panel') {
            item.key = uniqueKey(pageKeys, (item.key || 'panel'));
            pageKeys[item.key] = true;
            if (this.wizard.full) {
                this.options.show = this.options.show || {};
                this.options.show[item.key] = true;
            } else if (Object.prototype.hasOwnProperty.call(this.wizard, 'full')
                && !_.isEqual(this.originalOptions.show, this.options.show)) {
                this.options.show = Object.assign({}, (this.originalOptions.show || {}));
            }
        }
        this.originalComponents.push(_.clone(item));
    });
    if (!Object.keys(pageKeys).length) {
        const newPage = {
            type: 'panel',
            title: 'Page 1',
            label: 'Page 1',
            key: 'page1',
            components: this.component.components
        };
        this.component.components = [newPage];
        this.originalComponents.push(_.clone(newPage));
    }
}

@Component({
    selector: 'mat-formio-wizard-builder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        `
            @use '@angular/material' as mat;

            .active-page {
                @include mat.chips-overrides((
                label-text-color: var(--color-on-primary-container)
                ));
            }
        `
    ],
    imports: [
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatFormField,
        MatIcon,
        MatIconButton,
        MatInput,
        NgStyle,
        NgClass,
        MatChipOption,
        MatChipAvatar,
        MatChipSet,
        MatCard,
        MatCardContent
    ],
    template: `
        @if (component) {
            <div class="flex flex-col">
                <div class="flex flex-row">
                    <div class="w-2/12">
                        <mat-card appearance="outlined">
                            <mat-card-content>
                                <div>
                                    <mat-form-field class="w-full" [subscriptSizing]="'dynamic'" [ngStyle]="{
                                        zoom: '0.7'
                                        }">
                                        <input matInput #search placeholder="Search field(s)">
                                        <button
                                                mat-icon-button
                                                matSuffix
                                                type="button">
                                            <mat-icon svgIcon="formio:search"></mat-icon>
                                        </button>
                                    </mat-form-field>
                                    <mat-accordion>
                                        @for (groupOrder of groupOrders; track groupOrder) {
                                            <mat-expansion-panel [expanded]="instance().groups[groupOrder].default">
                                                <mat-expansion-panel-header>
                                                    {{ t(instance().groups[groupOrder].title) }}
                                                </mat-expansion-panel-header>
                                                <div [attr.ref]="'sidebar-container'" #sidebarContainer>
                                                    @if (componentOrders[groupOrder].length) {
                                                        @for (componentOrder of componentOrders[groupOrder]; track componentOrder) {
                                                            <div class="pt-1.5 drag-copy"
                                                                 #sidebarComponent
                                                                 [attr.data-group]="groupOrder"
                                                                 [attr.data-key]="instance().groups[groupOrder].components[componentOrder].key"
                                                                 [attr.data-type]="instance().groups[groupOrder].components[componentOrder].schema.type"
                                                                 tabindex="{{instance().keyboardActionsEnabled ? 0 : -1}}">
                                                                <div
                                                                        class="pl-2 space-x-0.5 flex items-center justify-items-end bg-primary shadow-lg rounded-md h-10">
                                                                    <mat-icon class="text-on-primary icon-size-4"
                                                                              [svgIcon]="instance().groups[groupOrder].components[componentOrder].icon ? iconClass('', instance().groups[groupOrder].components[componentOrder].icon) : 'formio:copy'">
                                                                    </mat-icon>
                                                                    <div class="ml-1.5 leading-5 mr-auto pl-1 text-on-primary">
                                                                        {{ instance().groups[groupOrder].components[componentOrder].title }}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    } @else {
                                                        {{ t('No matches found') }}
                                                    }
                                                </div>
                                            </mat-expansion-panel>
                                        }
                                    </mat-accordion>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    </div>
                    <div class="w-10/12 pl-2">
                        <div class="breadcrumb wizard-pages pl-4">
                            <mat-chip-set>
                                @for (page of instance().pages; track page; let pageIndex = $index) {
                                    <mat-chip-option [id]="page.key" (click)="setPage(pageIndex)" class="active-page"
                                                     [ngClass]="{
                                        'bg-primary-container text-on-primary-container': instance().page === pageIndex,
                                        'bg-secondary-container text-on-secondary-container': instance().page !== pageIndex
                                    }">{{ page.title }}
                                    </mat-chip-option>
                                }
                                <mat-chip-option [title]="instance().t('Create Page')" (click)="addPage()">
                                    <mat-icon matChipAvatar svgIcon="formio:plus-circle"></mat-icon>
                                    {{ instance().t('Page') }}
                                </mat-chip-option>
                            </mat-chip-set>
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
        this.instance().addPage();
    }

    setPage(index: number) {
        this.instance().setPage(index);
    }

    initialize() {
        super.initialize();

        if (this.instance()) {
            this.instance().parent.formioContainer = this.instance().webform.component.components || []
            this.instance().parent.formioComponent = this.instance().webform;
            this.instance().parent.formioComponent.rebuild = () => Promise.resolve();
        }
    }
}
