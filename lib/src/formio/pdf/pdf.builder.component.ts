import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { NgStyle } from '@angular/common';
import { MaterialPdfComponent } from './pdf.component';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';
import _ from 'lodash';
import { Utils } from 'formiojs';
import autoScroll from 'dom-autoscroller';
import BuilderUtils = Utils.BuilderUtils;
import { uniquify } from '../web-builder/web-builder.component';

console.log('Utils', Utils, BuilderUtils);

@Component({
    selector: 'mat-formio-pdf-builder',
    template: `
        @if (component) {
            <div class="formio builder row formbuilder">
                <div class="col-xs-4 col-sm-3 col-md-2 formcomponents">
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
                                    @for (componentOrder of componentOrders[groupOrder]; track componentOrder) {
                                        <div class="pt-1.5 drag-copy"
                                             draggable="true"
                                             (dragstart)="onDragStart($event)"
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
                                </mat-expansion-panel>
                            }
                        </mat-accordion>
                    </div>
                </div>
                <div class="col-xs-8 col-sm-9 col-md-10">
                    <div class="formio-pdf">
                        <div class="relative h-280 z-99">
                            <div class="absolute z-30 right-10">
                                <button mat-mini-fab class="bg-primary text-on-primary"
                                        (click)="zoom(true)"
                                        style="position:absolute;right:40px;top:30px;cursor:pointer;">
                                    <mat-icon svgIcon="feather:zoom-in"></mat-icon>
                                </button>
                                <button mat-mini-fab class="bg-primary text-on-primary"
                                        (click)="zoom()"
                                        [disabled]="containerZoom <= minContainerZoom"
                                        style="position:absolute;right:40px;top:80px;cursor:pointer;">
                                    <mat-icon svgIcon="feather:zoom-out"></mat-icon>
                                </button>
                                <div data-noattach="true" ref="iframeContainer"></div>
                            </div>
                            <iframe #iframe class="absolute top-0 w-full h-full border-0 z-10"
                                    (load)="iframeLoaded()"></iframe>
                            <div class="absolute top-0 left-0 z-20 overflow-y-scroll w-full h-full" [ngStyle]="{
                                    zoom: containerZoom
                                }" (scroll)="scroll($event)" (dragover)="dragover($event)"
                                 (drop)="onDrop($event)" #scrollContainer>
                                <div #container></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }
    `,
    imports: [
        NgStyle,
        MatIcon,
        MatMiniFabButton,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        TranslocoPipe,
        MatFormField,
        MatInput,
        MatIconButton,
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialPdfBuilderComponent extends MaterialPdfComponent {
    dragging = false;
    resizing = false;
    enableEdit = true;

    constructor() {
        super();
        effect(() => {
            if (this.instance) {
                this.initialize();
            }
        });
    }

    initialize() {
        super.initialize();

        this.instance.emit('change', this.instance.form);

        if (this.container()) {
            this.container()!.nativeElement.formioContainer = this.instance.webform.component.components || []
            this.container()!.nativeElement.formioComponent = this.instance.webform;
            this.container()!.nativeElement.formioComponent.rebuild = () => Promise.resolve();

            const _this = this;
            autoScroll([this.container()!.nativeElement], {
                margin: 20,
                maxSpeed: 6,
                scrollWhenOutside: true,
                autoScroll: function () {
                    return this.down && _this.dragging;
                }
            });
        }
    }

    onDragStart(event) {
        const key = event.target.getAttribute('data-key');
        const type = event.target.getAttribute('data-type');
        const group = event.target.getAttribute('data-group');
        event.dataTransfer.setData('key', key);
        event.dataTransfer.setData('type', type);
        event.dataTransfer.setData('group', group);
    }

    dragover(event) {
        event.preventDefault();
    }

    findDropPage(offsetX: number, offsetY: number) {
        const adjustedDropOffsetY = offsetY / this.containerZoom;
        const adjustedDropOffsetX = offsetX / this.containerZoom;

        const pageParams = this.pages.find(page => page.page == this.page);
        if (pageParams) {
            return {
                top: adjustedDropOffsetY - pageParams.marginTop,
                left: adjustedDropOffsetX
            };
        }
        return null;
    }

    onDrop(event) {
        const offsetX = event.offsetX;
        const offsetY = event.offsetY;

        const key = event.dataTransfer.getData('key');
        const type = event.dataTransfer.getData('type');
        const group = event.dataTransfer.getData('group');

        const dropPage = this.findDropPage(offsetX, offsetY);

        if (dropPage) {
            const schema = Utils['fastCloneDeep'](this.instance.schemas[type]);

            if (key && group) {
                const info = this.instance.getComponentInfo(key, group);
                _.merge(schema, info);

                // Set a unique key for this component.
                uniquify([this.instance.webform._form], schema);
                this.instance.webform._form.components.push(schema);
                const WIDTH = 100;

                const pageParams = this.pages.find(p => p.page == this.page);
                if (pageParams) {
                    schema.overlay = {
                        top: dropPage.top - (this.defaultHeight / 2),
                        left: dropPage.left - (WIDTH / 2),
                        width: WIDTH,
                        height: this.defaultHeight,
                        page: this.page
                    };

                    this.instance.webform.addComponent(schema, {}, null, true);
                    this.container()!.nativeElement.formioContainer.push(schema)
                    this.instance.editComponent(schema, this.container()!.nativeElement, true, null, null);

                    this.container()!.nativeElement.scroll(0, 0);

                    this.renderComponents()
                }
            }
        }
    }

    renderComponents() {
        this.initializeContainer();

        this.enableEdit = true;

        const container = this.container()!.nativeElement;
        const components = this.instance.webform?.component.components || this.component.components;

        const elements = Array.from(container.children).flatMap((child: any) => Array.from(child.children));
        elements.forEach((element: any) => {
            const component = components.find(cmp => cmp.id === element.id);

            element.addEventListener('click', () => {
                if (component && !(this.resizing || this.dragging) && this.enableEdit) {
                    this.instance.editComponent(component, this.container()!.nativeElement, false, null, null);
                }
            });

            const instance = (this.instance.webform?.components || this.instance.components).find(cmp => cmp.id === element.id);
            if (component && instance) {
                let style = 'position: absolute; resize: horizontal;';
                let r = 1;
                const overlay = component.overlay;
                if (overlay && (overlay.left || overlay.left === 0) && (overlay.top || overlay.top === 0) && overlay.page) {
                    const pageParams = this.pages.find(p => p.page == overlay.page);
                    if (pageParams) {
                        let width: number;
                        let height: number;
                        style += ` top: ${overlay.top}px;`;
                        style += ` left: ${overlay.left}px;`;
                        if (overlay.width && ('string' == typeof overlay.width && overlay.width.endsWith('%') && (overlay.width = Number(overlay.width.replace('%', '')) / 100))) {
                            width = parseInt(overlay.width, 10);
                        } else {
                            width = parseInt(overlay.width, 10);
                        }
                        style += ` width: ${width}px;`;
                        if (overlay.height && ('string' == typeof overlay.height && overlay.height.endsWith('%') && (overlay.height = Number(overlay.height.replace('%', '')) / 100))) {
                            height = parseInt(overlay.height, 10);
                        } else {
                            height = parseInt(overlay.height, 10);
                        }
                        style += ` height: ${height}px;`;
                        element.setAttribute('style', style);
                        element.classList.add('pdf-component');

                        const p = window.document.createElement('p');
                        p.innerHTML = component.type;
                        element.appendChild(p)

                        const resizeHandle = document.createElement('div');
                        resizeHandle.classList.add('resize-handle');
                        element.appendChild(resizeHandle);

                        this.repositionComponent(element, resizeHandle, component);

                        this.cdr.markForCheck();
                    }
                } else {
                    element.setAttribute('style', `display: none;`);
                }
            }
        });
    }

    updateComponent(component: any) {
        this.instance.emit('updateComponent', component);
        this.instance.emit('change', this.instance.form);
    }

    private repositionComponent(element: any, resizeHandle: HTMLDivElement, component) {
        const container = element.parentNode;

        element.addEventListener('mousedown', (e) => {
            this.dragging = true;

            e.preventDefault();

            // Get the initial mouse and element dimensions
            const initialMouseX = e.clientX / this.containerZoom;
            const initialMouseY = e.clientY / this.containerZoom;
            const initialLeft = element.offsetLeft;
            const initialTop = element.offsetTop;
            document.body.style.cursor = 'grabbing';
            container.style.cursor = 'grabbing';


            const containerRect = container.getBoundingClientRect();

            const onMouseMove = (e) => {
                if (this.resizing || !this.dragging) {
                    return;
                }
                this.enableEdit = false;
                // Calculate the new position
                let newLeft = initialLeft + (e.clientX / this.containerZoom - initialMouseX);
                let newTop = initialTop + (e.clientY / this.containerZoom - initialMouseY);

                // Ensure new position stays within the container bounds
                const maxLeft = containerRect.width - element.offsetWidth;
                const maxTop = containerRect.height - element.offsetHeight;

                if (newLeft < 0) {
                    newLeft = 0;
                } else if (newLeft > maxLeft) {
                    newLeft = maxLeft;
                }

                if (newTop < 0) {
                    newTop = 0;
                } else if (newTop > maxTop) {
                    newTop = maxTop;
                }

                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;

                const dropPage = this.findDropPage(newLeft, newTop);
                const pageParams = this.pages.find(p => p.page == this.page);

                component.overlay = Object.assign({}, component.overlay, {
                    left: dropPage!.left * this.containerZoom,
                    top: dropPage!.top * this.containerZoom + pageParams!.marginTop,
                    page: this.page
                });

                this.updateComponent(component);
            }

            const onMouseUp = () => {
                this.dragging = false;
                setTimeout(() => this.enableEdit = true, 3000);
                document.body.style.cursor = 'default';
                container.style.cursor = 'default';

                // Remove the event listeners when the mouse button is released
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            // Add event listeners for mousemove and mouseup
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        resizeHandle.addEventListener('mousedown', (e) => {
            this.resizing = true;

            e.preventDefault();

            // Get the initial mouse and element dimensions
            const initialWidth = element.offsetWidth;
            const initialHeight = element.offsetHeight;
            const initialMouseX = e.clientX;
            const initialMouseY = e.clientY;
            const containerRect = container.getBoundingClientRect();


            const onMouseMove = (e) => {
                if (!this.resizing) {
                    return;
                }
                this.enableEdit = false;
                // Calculate the new width and height
                let newWidth = initialWidth + (e.clientX - initialMouseX);
                let newHeight = initialHeight + (e.clientY - initialMouseY);

                if (newWidth < 30) {
                    newWidth = 35;
                }

                if (newWidth > 500) {
                    newWidth = 490;
                }

                if (newHeight < 15) {
                    newHeight = 19;
                }

                if (newHeight > 500) {
                    newHeight = 500;
                }

                // Apply the new dimensions to the resizable element
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;

                component.overlay = Object.assign({}, component.overlay, {
                    width: newWidth,
                    height: newHeight / this.containerZoom,
                });
                this.updateComponent(component);
            }

            const onMouseUp = () => {
                this.resizing = false;
                setTimeout(() => this.enableEdit = true, 3000);

                // Remove the mousemove and mouseup event listeners
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            // Attach the mousemove and mouseup event listeners to the document
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
}
