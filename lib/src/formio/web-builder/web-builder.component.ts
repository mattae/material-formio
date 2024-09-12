import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild, viewChildren } from '@angular/core';
import { MaterialComponent } from '../material.component';
import IconClass from '../module/icons/iconClass';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgStyle } from '@angular/common';
import autoScroll from 'dom-autoscroller';
import _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { MaterialComponentEditComponent } from './edit.dialog.component';
import { Utils } from 'formiojs';
import eachComponent = Utils.eachComponent;
import uniqueKey = Utils.uniqueKey;

export const uniquify = (container, component) => {
    let changed = false;
    const formKeys = {};
    eachComponent(container, (comp) => {
        formKeys[comp.key] = true;

        if (['address', 'container', 'datagrid', 'editgrid', 'dynamicWizard', 'tree'].includes(comp.type) || comp.tree || comp.arrayTree) {
            return true;
        }
        return false;
    }, true);

    // Recurse into all child components.
    eachComponent([component], (component): boolean => {
        // Skip key uniquification if this component doesn't have a key.
        if (!component.key) {
            return true;
        }

        const newKey = uniqueKey(formKeys, component.key);
        if (newKey !== component.key) {
            component.key = newKey;
            changed = true;
        }

        formKeys[newKey] = true;

        if (['address', 'container', 'datagrid', 'editgrid', 'dynamicWizard', 'tree'].includes(component.type) || component.tree || component.arrayTree) {
            return true;
        }
        return false;
    }, true);

    return changed;
}

@Component({
    selector: 'mat-formio-web-builder',
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
                    <div class="w-10/12" [attr.ref]="'form'" #form>

                    </div>
                </div>
            </div>
        }
    `,
    standalone: true,
    imports: [
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatFormField,
        MatIcon,
        MatIconButton,
        MatInput,
        MatMiniFabButton,
        TranslocoPipe,
        NgStyle
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialWebBuilderComponent extends MaterialComponent {
    sidebarComponent = viewChildren('sidebarComponent', {read: ElementRef});
    sidebarContainer = viewChildren('sidebarContainer', {read: ElementRef});
    form = viewChild('form', {read: ElementRef});
    search = viewChild('search', {read: ElementRef});
    iconClass = IconClass;
    groupOrders = [];
    componentOrders: any = {};
    _groupOrders = [];
    _componentOrders: any = {};
    #dialog = inject(MatDialog);

    constructor() {
        super();
        effect(() => {
            if (this.instance) {
                this.initialize();
            }
        });
    }

    initialize() {
        this.initializeSidebar();

        this.instance.editComponent = (component, parent, isNew, isJsonEdit, original, flags = {}) => {
            this.#dialog.open(MaterialComponentEditComponent, {
                data: {
                    instance: this.instance, component, parent, isNew, isJsonEdit, original, flags
                },
                height: 'calc(90% - 100px)',
                width: 'calc(90% - 100px)',
                maxWidth: '100%',
                maxHeight: '100%'
            }).afterClosed().subscribe(_ => {
                this.instance.editForm.destroy(true);
                if (this.instance.preview) {
                    this.instance.preview.destroy(true);
                    this.instance.preview = null;
                }
                if (isNew && !this.instance.saved) {
                    this.instance.removeComponent(component, parent, original);
                }
                this.instance.highlightInvalidComponents();
            })
        }

        if (this.search()) {
            this.search()!.nativeElement.addEventListener('input', (e) => {
                _.debounce(() => {
                    const searchString = e.target.value;
                    this.searchFields(searchString);
                }, 300)()
            });
        }

        if (this.sidebarComponent()) {
            Array.from(this.sidebarComponent()).forEach((cmp) => {
                const component = cmp.nativeElement;
                this.instance.addEventListener(component, 'keydown', (event) => {
                    if (event.keyCode === 13) {
                        this.instance.addNewComponent(component);
                    }
                });
            })
        }
        if (this.form() && this.sidebarContainer()) {
            this.form()!.nativeElement.innerHTML = this.instance.webform.render();

            this.instance.refs['sidebar-container'] = Array.from(this.sidebarContainer()).map((cmp) => cmp.nativeElement);
            if (this.instance.dragDropEnabled) {
                this.instance.initDragula();
            }

            const drake = this.instance.dragula;

            autoScroll([window], {
                margin: 20,
                maxSpeed: 6,
                scrollWhenOutside: true,
                autoScroll: function () {
                    return this.down && drake?.dragging;
                }
            });

            this.instance.webform.attach(this.form()!.nativeElement);
        }
    }

    initializeSidebar() {
        if (!this.search() || !this.search()!.nativeElement.value) {
            this.groupOrders = this.instance.groupOrder;
            this.groupOrders?.forEach(groupOrder => {
                this.componentOrders[groupOrder] = this.instance.groups[groupOrder].componentOrder
            });
        } else {
            this.groupOrders = this._groupOrders;
            this.componentOrders = this._componentOrders;
        }
        this.cdr.markForCheck();
    }

    searchFields(searchString = '') {
        const searchValue = searchString.toLowerCase();
        const filterGroupBy = (group, searchValue = '') => {
            const result = _.toPlainObject(group);
            const {subgroups = [], components} = result;
            const filteredComponents: any = [];

            for (const key in components) {
                const isMatchedToTitle = this.instance.t(components[key].title).toLowerCase().match(searchValue);
                const isMatchedToKey = components[key].key.toLowerCase().match(searchValue);

                if (isMatchedToTitle || isMatchedToKey) {
                    filteredComponents.push(components[key]);
                }
            }

            this.instance.orderComponents(result, filteredComponents);
            if (searchValue) {
                result.default = true;
            }
            if (result.componentOrder.length || subgroups.length) {
                return result;
            }
            return null;
        };

        const filterGroupOrder = (groupOrder, searchValue) => {
            const result = _.cloneDeep(groupOrder);
            return result.filter(key => filterGroupBy(this.instance.groups[key], searchValue));
        };

        const filterSubgroups = (groups, searchValue) => {
            const result = _.clone(groups);
            return result
                .map(subgroup => filterGroupBy(subgroup, searchValue))
                .filter(subgroup => !_.isNull(subgroup));
        };

        this._groupOrders = filterGroupOrder(this.instance.groupOrder, searchValue);
        this._groupOrders.forEach(grp => {
            this._componentOrders[grp] = filterGroupBy(this.instance.groups[grp], searchValue).componentOrder;
        });

        this.initializeSidebar();
        /*const toTemplate = groupKey => {
            return {
                group: filterGroupBy(this.instance.groups[groupKey], searchValue),
                groupKey,
                groupId: sidebar.id || sidebarGroups.id,
                subgroups: filterSubgroups(this.groups[groupKey].subgroups, searchValue)
                    .map((group) => this.renderTemplate('builderSidebarGroup', {
                        group,
                        groupKey: group.key,
                        groupId: `group-container-${groupKey}`,
                        subgroups: []
                    })),
            };
        };*/
    }
}
