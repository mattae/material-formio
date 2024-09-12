import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { NgStyle } from '@angular/common';
import { MatButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MaterialWebBuilderComponent } from '../web-builder/web-builder.component';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { Components, Displays } from 'formiojs';

Displays.getDisplay('pdf').prototype.attach = function (element) {
    return Components.components.base.prototype.attach.call(this, element);
}

@Component({
    selector: 'mat-formio-pdf',
    standalone: true,
    template: `
        <mat-card appearance="raised">
            <mat-card-content>
                <div class="formio-pdf relative overflow-hidden h-280 z-99">
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
                    <iframe #iframe class="absolute top-0 w-full h-full border-0 z-10" (load)="iframeLoaded()"></iframe>
                    <div class="absolute top-0 left-0 z-20 w-full h-full overflow-y-scroll" [ngStyle]="{
                        zoom: containerZoom
                    }" (scroll)="scroll($event)" #scrollContainer>
                        <div #container></div>
                    </div>
                </div>
                <mat-card-actions>
                    <div class="flex flex-row justify-start pt-2">
                        <button mat-raised-button color="primary">Submit</button>
                    </div>
                </mat-card-actions>
            </mat-card-content>
        </mat-card>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgStyle,
        MatIconButton,
        MatIcon,
        MatMiniFabButton,
        MatButton,
        MatCard,
        MatCardContent,
        MatCardActions
    ],
})
export class MaterialPdfComponent extends MaterialWebBuilderComponent {
    container = viewChild('container', {read: ElementRef});
    iframe = viewChild('iframe', {read: ElementRef});
    http = inject(HttpClient);
    src: string;
    doc: any;
    pdfLoaded
    containerZoom = 1;
    readonly defaultHeight = 42;
    readonly maxZoom = 3;
    readonly minComponentZoom = 0.4;
    readonly minContainerZoom = 0.45
    readonly zoomDelta = .025;
    page = 1;
    pages: {
        page: number,
        top: number,
        left: number,
        container: any,
        marginTop: number
    }[] = [];

    constructor() {
        super();
        effect(() => {
            if (this.instance) {
                this.instance.iframeReadyResolve = () => {
                }
                this.initialize();
            }
        })
    }

    initialize() {
        super.initialize();
        const src = `${this.instance.form.settings.pdf.src}.html`;
        this.http.get(src, {responseType: 'text'}).subscribe(res => {
            const blob = new Blob([res], {type: 'text/html'});
            this.src = URL.createObjectURL(blob);

            if (this.iframe() && !this.pdfLoaded) {
                const iframe = this.iframe()!.nativeElement;
                iframe.src = this.src;
                this.pdfLoaded = true;
            }
        });
    }

    initializeContainer() {
        const components = this.instance.webform?.components || this.component.components || [];
        components.forEach((component: { hideLabel: boolean; hideError: boolean; inPdf: boolean; }) => {
            component.hideLabel = true;
            component.hideError = true;
            component.inPdf = true;
        });

        if (this.container()) {
            const container = this.container()!.nativeElement;
            container.innerHTML = (this.instance.webform || this.instance).renderComponents();

            let pages = this.doc.querySelectorAll('div.pf.w0');
            Array.from(pages).forEach((page: any, index) => {
                const div = window.document.createElement('div')
                const computedStyle = window.getComputedStyle(page);
                div.setAttribute('style', `width: ${computedStyle.width}; margin: 13px auto; position: ${computedStyle.position}; height: ${computedStyle.height};`);
                div.setAttribute('data-page-no', page.getAttribute('data-page-no'));
                div.classList.add('pf', 'w0');
                container.appendChild(div);

                div.addEventListener('drop', (e) => {
                    this.page = parseInt(div.getAttribute('data-page-no')!);
                })

                div.addEventListener('mouseup', (e) => {
                    this.page = parseInt(div.getAttribute('data-page-no')!);
                })
            });

            pages = container.querySelectorAll('div.pf.w0');
            Array.from(container.children).forEach((element: any) => {
                const component = components.find(cmp => cmp.id === element.id);
                if (component && component.component && component.component.overlay && component.component.overlay.page) {
                    const page = pages[component.component.overlay.page - 1];
                    if (page) {
                        page.appendChild(element.cloneNode(true));
                        element.remove();
                    }
                }
                if (component && component.overlay && component.overlay.page) {
                    const page = pages[component.overlay.page - 1];
                    if (page) {
                        page.appendChild(element.cloneNode(true));
                        element.remove();
                    }
                }
            });
        }
    }

    iframeLoaded() {
        if (this.iframe()) {
            const iframe = this.iframe()!.nativeElement;
            this.doc = iframe.contentDocument || iframe.contentWindow.document;
            const loaders = this.doc.querySelectorAll(`div.loader-wrapper`);
            if (loaders) {
                Array.from(loaders).forEach((loader: any) => loader.remove());
            }
            let el = this.doc.querySelector(`div.pf.w0`)
            const container = this.container()!.nativeElement;
            if (el) {
                const computedStyle = window.getComputedStyle(el);
                container.setAttribute('style', `width: ${computedStyle.width}; margin: ${computedStyle.margin.replace('0px', 'auto')}; position: ${computedStyle.position};`);
            }
        }

        this.calculatePageParams();
        this.cdr.markForCheck();

        this.zoom(true);
        this.renderComponents();
    }

    scroll(event) {
        const iframe = this.iframe()!.nativeElement;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const el = doc.querySelector(`#page-container`);
        const clientRec = el.getBoundingClientRect();

        el.scroll(clientRec.left + event.target.scrollLeft, clientRec.top + event.target.scrollTop);
        this.cdr.markForCheck();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.renderComponents();
    }

    zoom(out?: boolean) {
        if (out) {
            this.containerZoom += this.zoomDelta;
        } else if ((this.containerZoom - this.minContainerZoom) > 0.0000001) {
            this.containerZoom -= this.zoomDelta;
        }

        const iframe = this.iframe()!.nativeElement;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const el = doc.querySelector(`body`);
        el.setAttribute('style', `zoom: ${this.containerZoom}`);

        this.renderComponents();
    }

    calculatePageParams() {
        this.pages = [];
        const iframe = this.iframe()!.nativeElement;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const pages = doc.querySelectorAll('div.pf.w0');

        Array.from(pages).forEach((page: any, index) => {
            this.pages.push({
                page: index + 1,
                top: page.offsetTop,
                left: page.offsetLeft,
                container: page,
                marginTop: parseInt(window.getComputedStyle(page).marginTop)
            });
        });

        const el = doc.querySelector(`#page-container`)
        if (el) {
            const style = `height: ${el.scrollHeight}px;`;

            this.container()!.nativeElement.setAttribute('style', style);
        }
    }

    renderComponents() {
        this.initializeContainer();

        const container = this.container()!.nativeElement;
        const components = this.instance.webform?.component.components || this.component.components;

        const elements = Array.from(container.children).flatMap((child: any) => Array.from(child.children));
        elements.forEach((child: any) => {
            const component = components.find(cmp => cmp.id === child.id);
            const instance = (this.instance.webform?.components || this.instance.components).find(cmp => cmp.id === child.id);
            if (component && instance) {
                let style = 'position: absolute;';
                const overlay = component.overlay;
                if (overlay && (overlay.left || overlay.left === 0) && (overlay.top || overlay.top === 0) && overlay.page) {
                    const pageParams = this.pages.find(p => p.page == overlay.page);
                    const top = overlay.top - pageParams!.marginTop;
                    const left = overlay.left;
                    let width = 0;
                    let height = 0;
                    if (pageParams) {
                        style += `top: ${top}px;`;
                        style += `left: ${left}px;`;

                        if (overlay.width && ('string' == typeof overlay.width && overlay.width.endsWith('%') && (overlay.width = Number(overlay.width.replace('%', '')) / 100))) {
                            width = parseInt(overlay.width, 10)
                        } else {
                            width = parseInt(overlay.width, 10)
                        }

                        if (overlay.height && ('string' == typeof overlay.height && overlay.height.endsWith('%') && (overlay.height = Number(overlay.height.replace('%', '')) / 100))) {
                            height = parseInt(overlay.height, 10);
                        } else {
                            height = parseInt(overlay.height, 10);
                        }
                        style += `height: ${height}px;`;
                        const defaultZoom = 0.9;

                        if (overlay.height !== this.defaultHeight) {
                            //const newZoom = this.containerZoom * overlay.height / this.defaultHeight;
                            const newZoom = overlay.height * defaultZoom / this.defaultHeight;
                            const zoom = Math.max(this.minComponentZoom, Math.min(newZoom, this.maxZoom));
                            style += `width: ${width / zoom}px;`;
                            style += `transform: scale(${zoom}); transform-origin: bottom left;`
                        } else {
                            style += `width: ${width}px; transform: scale(${defaultZoom}); transform-origin: bottom left;`
                        }
                        child.setAttribute('style', style);

                        instance.attach(child);

                        this.cdr.markForCheck();
                    }
                }
            }
        });
    }
}
