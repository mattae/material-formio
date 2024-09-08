import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    ElementRef,
    inject,
    TemplateRef,
    viewChild
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButton, MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CommonModule, NgStyle } from '@angular/common';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { PopoverService } from '@mattae/angular-shared';
import { eventBus } from '../formio.service';

@Component({
    selector: 'signature-overlay',
    template: `
        @if (instance) {
            <div class="flex flex-col bg-card w-180 p-0.5">
                <div class="">
                    <div class="w-full">
                        <div
                                class="signature-pad-body "
                                style="padding: 0; margin: 0;"
                                [ngStyle]="{
                                width: component.width,
                                height: component.height
                            }"
                                tabindex="{{component.tabindex || 0}}"
                                [attr.ref]="'padBody'"
                        >
                            <canvas class="signature-pad-canvas" style="display: none;" [attr.ref]="'canvas'"
                                    #canvas
                                    [ngStyle]="{height: component.height}">
                            </canvas>
                            <div class="signature-pad-refresh absolute top-0 left-0 z-9999">
                                <button mat-icon-button [attr.ref]="'refresh'">
                                    <mat-icon svgIcon="mat_outline:refresh"></mat-icon>
                                </button>
                            </div>
                            <img style="width: 100%; display: inherit;" [attr.ref]="'signatureImage'">
                        </div>
                    </div>

                </div>
                <div class="flex flex-row">
                    <div class="w-1/3"></div>
                    @if (instance.component.footer) {
                        <div class="signature-pad-footer w-1/3">
                            {{ instance.component.footer | transloco }}
                        </div>
                    }
                    <div class="flex flex-row justify-end ml-auto">
                        <button mat-raised-button color="primary" (click)="close()">Close</button>
                    </div>
                </div>
            </div>
        }
    `,
    imports: [
        NgStyle,
        MatIcon,
        MatIconButton,
        TranslocoPipe,
        MatButton
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignatureOverlay {
    cdr = inject(ChangeDetectorRef)
    element = inject(ElementRef)
    canvas = viewChild('canvas', {read: ElementRef});
    component: any;
    instance: any;
    #id = Math.random().toString(36).substring(7, 9);

    constructor() {

        eventBus.on('setSignatureInstance', (id, instance) => {
            if (id === this.#id) {
                this.instance = instance;
                this.component = instance.component;

                this.cdr.markForCheck()
            }
        });

        eventBus.emit('instanceInitialized', null, this.#id);

        effect(() => {
            if (this.canvas()) {
                this.instance.attach(this.element.nativeElement);
            }
        });
    }

    close() {
        eventBus.emit('instanceClosed', null, this.component.id);
    }
}

@Component({
    selector: 'mat-formio-signature',
    template: `
        @if (component) {
            @if (component.inPdf) {
                <div class="justify-center text-2xl flex flex-row items-center" (click)="padClicked()"
                     [ngClass]="{
                        'sign h-full': !instance.dataValue
                     }">
                    @if (!instance.dataValue) {
                        <div class="flex text-center justify-center">
                            Click to sign
                        </div>
                    } @else {
                        <img style="width: 100%; display: inherit;" #img>
                    }
                </div>
            } @else {
                <div>
                    <mat-formio-form-field [component]="component"
                                           [componentTemplate]="componentTemplate">
                    </mat-formio-form-field>
                    <ng-template #componentTemplate let-hasLabel>
                        @if (hasLabel) {
                            <mat-label>
                                <span [component]="component" matFormioLabel></span>
                            </mat-label>
                        }
                        <div class="w-full">
                            <div
                                    class="signature-pad-body"
                                    style="padding: 0; margin: 0;"
                                    [ngStyle]="{
                                width: component.width,
                                height: component.height
                            }"
                                    tabindex="{{component.tabindex || 0}}"
                                    [attr.ref]="'padBody'"
                            >
                                <canvas class="signature-pad-canvas" style="display: none;" [attr.ref]="'canvas'"
                                        #canvas
                                        [ngStyle]="{height: component.height}"></canvas>
                                <img style="width: 100%; display: inherit;" [attr.ref]="'signatureImage'">
                                <div class="signature-pad-refresh absolute top-0 left-0 z-99" #refresh>
                                    <button mat-icon-button [attr.ref]="'refresh'">
                                        <mat-icon svgIcon="mat_outline:refresh"></mat-icon>
                                    </button>
                                </div>
                            </div>
                        </div>

                        @if (instance.component.footer) {
                            <div class="signature-pad-footer">
                                {{ instance.component.footer | transloco }}
                            </div>
                        }
                    </ng-template>
                </div>
            }
        }
    `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        FormioFormFieldComponent,
        LabelComponent,
        TranslocoPipe,
    ],
    styles: [
        `
            .sign {
                background-color: var(--mdc-filled-text-field-container-color);
            }
            
            :host() {
                display: block;
                width: 100%;
            }
        `
    ]
})
export class MaterialSignatureComponent extends MaterialComponent {
    canvas = viewChild('canvas', {read: ElementRef});
    img = viewChild('img', {read: ElementRef});
    refresh = viewChild('refresh', {read: ElementRef})
    template = viewChild(TemplateRef);
    popover = inject(PopoverService);

    constructor() {
        super();

        effect(() => {

            if (this.instance && this.canvas() && this.refresh()) {
                this.component.input = true;

                this.instance.attach(this.element.nativeElement);
            }

            if (this.img()) {
                this.img()!.nativeElement.src = this.instance.dataValue;
            }

            if (this.instance && this.component.overlay && this.component.overlay.height && this.component.inPdf) {
                this.element.nativeElement.setAttribute('style', `height: ${this.component.overlay.height}px;`);
            }
        })
    }

    padClicked() {
        if (!this.isReadOnly) {
            const popoverRef = this.popover.open({
                content: SignatureOverlay,
                origin: this.element.nativeElement,
                offsetY: 20,
                position: [
                    {
                        originX: 'start',
                        originY: 'center',
                        overlayX: 'start',
                        overlayY: 'center'
                    },
                    {
                        originX: 'end',
                        originY: 'bottom',
                        overlayX: 'end',
                        overlayY: 'center'
                    }
                ]
            });
            popoverRef.afterClosed$.subscribe(_ => {
                this.img()!.nativeElement.src = this.instance.dataValue;
            });
            eventBus.on('instanceInitialized', (id) => {
                eventBus.emit('setSignatureInstance', null, id, this.instance);
            });

            eventBus.on('instanceClosed', (id) => {
                if (id === this.component.id) {
                    popoverRef.close();
                }
            });
        }
    }
}

