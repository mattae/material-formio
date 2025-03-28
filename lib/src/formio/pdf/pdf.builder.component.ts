import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild } from '@angular/core';
import { NgStyle } from '@angular/common';
import { MaterialPdfComponent } from './pdf.component';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import _ from 'lodash';
import { Utils } from '@formio/js';
import autoScroll from 'dom-autoscroller';
import { uniquify } from '../web-builder/web-builder.component';
import { MatCard, MatCardContent } from '@angular/material/card';
import {DragUploadDirective, FileHandle} from '../drag-and-drop.directive';

@Component({
    selector: 'mat-formio-pdf-builder',
    template: `
        @if (component && hasPdf()) {
            <div class="formio builder row formbuilder">
                <div class="col-xs-4 col-sm-3 col-md-2 formcomponents">
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
                                            @for (componentOrder of componentOrders[groupOrder]; track componentOrder) {
                                                <div class="pt-1.5 drag-copy"
                                                     draggable="true"
                                                     (dragstart)="onDragStart($event)"
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
                                        </mat-expansion-panel>
                                    }
                                </mat-accordion>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-xs-8 col-sm-9 col-md-10">
                    <div class="formio-pdf">
                        <div class="relative h-280 z-99">
                            <div class="absolute z-30 right-10">
                                <button mat-mini-fab class="bg-primary text-on-primary"
                                        (click)="zoom(true)"
                                        style="position:absolute;right:40px;top:30px;cursor:pointer;">
                                    <mat-icon svgIcon="formio:zoom-in" class="text-on-primary"></mat-icon>
                                </button>
                                <button mat-mini-fab class="bg-primary text-on-primary"
                                        (click)="zoom()"
                                        [disabled]="containerZoom <= minContainerZoom"
                                        style="position:absolute;right:40px;top:80px;cursor:pointer;">
                                    <mat-icon svgIcon="formio:zoom-out" class="text-on-primary"></mat-icon>
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
        } @else if (component && !hasPdf()) {
            <mat-card appearance="outlined" #upload>
                <mat-card-content>
                    <div class="pdf-upload formio-component-file">
                        <h3 class="label">{{ instance().t('Upload a PDF File') }}</h3>
                        <input #input type="file" style="opacity: 0; position: absolute;" tabindex="-1"
                               accept=".pdf, application/pdf"
                               (change)="onInputChange($event)"
                               [multiple]="false">
                        <div #dragDropText class="flex items-center justify-center h-16" upload
                             accept=".pdf, application/pdf" [multiple]="false"
                             (files)="uploadFiles($event)">
                            <div class="pl-2 flex items-center justify-center space-x-1.5">
                                <div class="pl-2 space-x-1.5 flex items-center justify-items-center">
                                    <mat-icon svgIcon="formio:cloud-arrow-up"
                                              class="icon-size-6 ml-auto mr-2 text-primary"></mat-icon>
                                    {{ instance().t('Drop pdf to start, or') }}
                                    <a (click)="click(input)" class="browse">{{ instance().t('browse') }}</a>
                                </div>
                            </div>
                        </div>

                        <div #uploadProgressWrapper
                             class="relative flex items-center justify-start bg-surface-container h-16"
                             style="display: none !important;">
                            <div #uploadProgress
                                 class="h-1 bg-primary-container text-sm text-center font-medium m-2 text-on-surface-container">
                            </div>
                        </div>

                        <div class="alert alert-danger" #uploadError>

                        </div>
                    </div>
                </mat-card-content>
            </mat-card>
        }
    `,
    imports: [
        NgStyle,
        MatIcon,
        MatMiniFabButton,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatFormField,
        MatInput,
        MatIconButton,
        MatCard,
        MatCardContent,
        DragUploadDirective,
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialPdfBuilderComponent extends MaterialPdfComponent {
    dragging = false;
    resizing = false;
    enableEdit = true;
    //Pixel difference between actual component and outer control handle
    #marginOffset = 8;
    dragDropText = viewChild('dragDropText', {read: ElementRef});
    uploadError = viewChild('uploadError', {read: ElementRef});
    uploadProgressWrapper = viewChild('uploadProgressWrapper', {read: ElementRef});
    uploadProgress = viewChild('uploadProgress', {read: ElementRef});

    constructor() {
        super();
        effect(() => {
            if (this.instance()) {
                this.initialize();

                if (this.uploadError()) {
                    this.instance().refs['uploadError'] = this.uploadError().nativeElement;
                }

                if (this.dragDropText()) {
                    this.instance().refs['dragDropText'] = this.dragDropText().nativeElement;
                }
                if (this.uploadProgress()) {
                    this.instance().refs['uploadProgress'] = this.uploadProgress().nativeElement;
                }
                if (this.uploadProgressWrapper()) {
                    this.instance().refs['uploadProgressWrapper'] = this.uploadProgressWrapper().nativeElement;
                }
            }
        });
    }

    initialize() {
        super.initialize();

        const instance = this.instance();
        this.instance().on('removeComponent', (component) => {
            component.destroy = component.destroy || function () {
            }
            this.instance().webform.removeComponent(component);
            this.renderComponents();
        })

        if (this.container()) {
            this.container()!.nativeElement.formioContainer = this.instance().webform.component.components || []
            this.container()!.nativeElement.formioComponent = this.instance().webform;
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
            const schema = Utils['fastCloneDeep'](this.instance().schemas[type]);

            if (key && group) {
                const info = this.instance().getComponentInfo(key, group);
                _.merge(schema, info);

                // Set a unique key for this component.
                uniquify([this.instance().webform._form], schema);
                this.instance().webform._form.components.push(schema);
                const WIDTH = 150;
                const pageParams = this.pages.find(p => p.page == this.page);
                if (pageParams) {
                    const margin = this.#marginOffset * this.containerZoom;
                    schema.overlay = {
                        top: dropPage.top - (this.defaultHeight / 2) + margin + 30,
                        left: dropPage.left - (WIDTH / 2) + margin,
                        width: WIDTH,
                        height: this.defaultHeight / 2,
                        page: this.page
                    };

                    this.instance().webform.addComponent(schema, {}, null, true);
                    this.container()!.nativeElement.formioContainer.push(schema)
                    this.instance().editComponent(schema, this.container()!.nativeElement, true, null, null);

                    this.container()!.nativeElement.scroll(0, 0);
                    this.renderComponents();

                    //Initial drop is a little off between builder and viewer; a slight move fixes it
                    setTimeout(() => {
                        const element = document.querySelector(`#${schema.id}`);
                        if (element) {
                            this.#simulateMouseClickAndDrag(element as any, 0.01, 0);
                        }
                    }, 0);
                }
            }
        }
    }

    renderComponents() {
        this.initializeContainer();

        this.enableEdit = true;

        const container = this.container()!.nativeElement;
        const components = this.instance().webform?.component.components || this.component.components;

        const elements = Array.from(container.children).flatMap((child: any) => Array.from(child.children));
        elements.forEach((element: any) => {
            const component = components.find(cmp => cmp.id === element.id);
            element.addEventListener('click', () => {
                if (component && !(this.resizing || this.dragging) && this.enableEdit) {
                    this.instance().editComponent(component, this.container()!.nativeElement, false, null, null);
                }
            });

            const instance = (this.instance().webform?.components || this.instance().components).find(cmp => cmp.id === element.id);
            if (component && instance) {
                let style = 'position: absolute; resize: horizontal; border-color: black;';
                let r = 1;
                const overlay = component.overlay;
                if (overlay && (overlay.left || overlay.left === 0) && (overlay.top || overlay.top === 0) && overlay.page) {
                    const pageParams = this.pages.find(p => p.page == overlay.page);
                    if (pageParams) {
                        let width: number;
                        let height: number;
                        if (overlay.width && ('string' == typeof overlay.width && overlay.width.endsWith('%') && (overlay.width = Number(overlay.width.replace('%', '')) / 100))) {
                            width = parseInt(overlay.width, 10);
                        } else {
                            width = parseInt(overlay.width, 10);
                        }
                        if (overlay.height && ('string' == typeof overlay.height && overlay.height.endsWith('%') && (overlay.height = Number(overlay.height.replace('%', '')) / 100))) {
                            height = parseInt(overlay.height, 10);
                        } else {
                            height = parseInt(overlay.height, 10);
                        }

                        const margin = this.#marginOffset * this.containerZoom;
                        const outerWidth = width + (margin * 2);
                        const outerHeight = height + (margin * 2);
                        style += ` top: ${overlay.top - 15}px;`;
                        style += ` left: ${overlay.left - 12}px;`;
                        style += ` width: ${outerWidth}px;`;
                        style += ` height: ${outerHeight}px;`;

                        element.classList.add('pdf-element');
                        element.setAttribute('style', style);

                        const container = document.createElement('div');
                        const containerStyle = `width: ${width}px; height: ${height}px`;
                        container.classList.add('pdf-component');
                        container.setAttribute('style', containerStyle);

                        const p = document.createElement('p');
                        p.innerHTML = component.type;
                        p.classList.add('element-type')
                        container.appendChild(p)
                        element.appendChild(container);

                        const resizeHandle = document.createElement('div');
                        resizeHandle.classList.add('resize-handle');
                        element.appendChild(resizeHandle);

                        this.#repositionComponent(element, resizeHandle, component);

                        this.cdr.markForCheck();
                    }
                } else {
                    element.setAttribute('style', `display: none;`);
                }
            }
        });

        this.instance().emit('updateComponent', {});
    }

    updateComponent(component: any) {
        const formInstance = this.instance();
        formInstance.form.components.forEach(c => {
            if (component.key === c.key) {
                c.overlay = component.overlay;
            }
        });
        formInstance.emit('updateComponent', component);
        formInstance.emit('change', formInstance.form);
    }

    uploadFiles(files: FileHandle[]) {
        this.instance().upload(files[0].file);
    }

    click(input: HTMLInputElement) {
        input.value = '';
        input.click();
    }

    onInputChange(event) {

        this.instance().upload(event.target.files[0]);
    }

    #repositionComponent(element: any, resizeHandle: HTMLDivElement, component) {
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

                const margin = this.#marginOffset * this.containerZoom;

                component.overlay = Object.assign({}, component.overlay, {
                    left: (dropPage!.left * this.containerZoom) + margin + 6,
                    top: (dropPage!.top * this.containerZoom + pageParams!.marginTop) + margin + 13,
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

                const pdfComponent = element.querySelector('.pdf-component');
                const margin = this.#marginOffset * this.containerZoom;
                const componentHeight = newHeight - (margin * 2);
                const componentWidth = newWidth - (margin * 2);
                // Apply the new dimensions to the resizable element
                pdfComponent.style.width = `${componentWidth}px`;
                pdfComponent.style.height = `${componentHeight}px`;

                component.overlay = Object.assign({}, component.overlay, {
                    width: componentWidth,
                    height: componentHeight / this.containerZoom,
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

    #simulateMouseClickAndDrag(element: HTMLElement, moveX: number, moveY: number) {
        // Get the target element (e.g., a div or any DOM element)
        const rect = element.getBoundingClientRect();
        const startX = rect.left + rect.width / 2; // Start at the center of the element
        const startY = rect.top + rect.height / 2;
        const targetElement = document.querySelector(`#${element.id}`);

        // Create and dispatch the mousedown event
        const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: startX,
            clientY: startY
        });
        targetElement.dispatchEvent(mouseDownEvent);

        // Create and dispatch the mousemove event (1 pixel to the right)
        const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: startX + moveX,
            clientY: startY + moveY
        });
        targetElement.dispatchEvent(mouseMoveEvent);

        // Create and dispatch the mouseup event
        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: startX + moveX,
            clientY: startY + moveY
        });
        targetElement.dispatchEvent(mouseUpEvent);
    }
}
