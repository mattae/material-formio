import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    ElementRef,
    inject,
    input,
    TemplateRef,
    viewChild
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButton, MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { CommonModule, NgStyle } from '@angular/common';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { MaterialComponent } from '../material.component';
import { eventBus } from '../formio.service';
import { MatCard } from '@angular/material/card';
import {
    MtxPopover,
    MtxPopoverContent,
    MtxPopoverPositionEnd,
    MtxPopoverPositionStart,
    MtxPopoverTrigger
} from '@ng-matero/extensions/popover';

@Component({
    selector: 'signature-overlay',
    template: `
        @if (instance()) {
            <div class="flex flex-col w-180">
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
                                    <mat-icon svgIcon="formio:refresh"></mat-icon>
                                </button>
                            </div>
                            <img style="width: 100%; display: inherit;" [attr.ref]="'signatureImage'">
                        </div>
                    </div>

                </div>
                <div class="flex flex-row">
                    <div class="w-1/3"></div>
                    @if (instance().component.footer) {
                        <div class="signature-pad-footer w-1/3">
                            {{ instance().t(instance().component.footer) }}
                        </div>
                    }
                    <div class="flex flex-row justify-end ml-auto">
                        <button mat-raised-button color="primary" (click)="close()">{{ instance().t('Close') }}</button>
                    </div>
                </div>
            </div>
            <mat-card></mat-card>
        }
    `,
    imports: [
        NgStyle,
        MatIcon,
        MatIconButton,
        MatButton,
        MatCard
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignatureOverlay {
    cdr = inject(ChangeDetectorRef)
    element = inject(ElementRef)
    canvas = viewChild('canvas', {read: ElementRef});
    component: any;
    instance = input.required<any>();

    constructor() {
        effect(() => {
            if (this.instance()) {
                this.component = this.instance().component;
                if (this.canvas()) {
                    this.instance().attach(this.element.nativeElement);
                }
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
                <div #popoverTrigger="mtxPopoverTrigger"
                     [mtxPopoverTriggerFor]="popover"
                     [mtxPopoverTriggerData]="{instance: instance()}"
                     mtxPopoverTriggerOn="click"></div>
                <div class="justify-center text-2xl flex flex-row items-center" (click)="padClicked()"
                     [ngClass]="{
                        'sign h-full': !instance().dataValue
                     }">
                    @if (!instance().dataValue) {
                        <div class="flex text-center justify-center">
                            Click to sign
                        </div>
                    } @else {
                        <img style="width: 100%; display: inherit;" #img>
                    }
                </div>
                <mtx-popover #popover="mtxPopover"
                             [enterDelay]="enterDelay"
                             [leaveDelay]="leaveDelay"
                             [position]="[positionStart, positionEnd]"
                             [xOffset]="xOffset"
                             [yOffset]="yOffset"
                             [closeOnPanelClick]="false"
                             [closeOnBackdropClick]="false"
                             [focusTrapEnabled]="true"
                             [hasBackdrop]="true">
                    <ng-template mtxPopoverContent let-instance="instance">
                        <div>
                            <signature-overlay [instance]="instance"/>
                        </div>
                    </ng-template>
                </mtx-popover>
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
                                height: component.height + 50
                            }"
                                    tabindex="{{component.tabindex || 0}}"
                                    [attr.ref]="'padBody'"
                            >
                                <canvas class="signature-pad-canvas" style="display: none;" [attr.ref]="'canvas'"
                                        #canvas
                                        [ngStyle]="{height: component.height + 50}"></canvas>
                                <img style="width: 100%; display: inherit;" [attr.ref]="'signatureImage'">
                                <div class="signature-pad-refresh absolute top-0 left-0 z-99" #refresh>
                                    <button mat-icon-button [attr.ref]="'refresh'">
                                        <mat-icon svgIcon="formio:refresh"></mat-icon>
                                    </button>
                                </div>
                            </div>
                        </div>

                        @if (instance().component.footer) {
                            <div class="signature-pad-footer">
                                {{ t(instance().component.footer) }}
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
        MtxPopover,
        MtxPopoverContent,
        SignatureOverlay,
        MtxPopoverTrigger
    ],
    styles: [
        `
            .sign {
                background-color: var(--mdc-filled-text-field-container-color);
            }

            :host {
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
    popoverTrigger = viewChild<MtxPopoverTrigger>('popoverTrigger');
    enterDelay = 100;
    leaveDelay = 100;
    xOffset = -10;
    yOffset = -10;

    positionStart: MtxPopoverPositionStart = 'below';
    positionEnd: MtxPopoverPositionEnd = 'after';

    constructor() {
        super();

        effect(() => {
            if (this.instance() && this.canvas() && this.refresh()) {
                this.component.input = true;

                this.instance().attach(this.element.nativeElement);
            }

            if (this.img()) {
                this.img()!.nativeElement.src = this.instance().dataValue;
            }

            if (this.instance() && this.component.overlay && this.component.overlay.height && this.component.inPdf) {
                this.element.nativeElement.setAttribute('style', `height: ${this.component.overlay.height}px;`);
            }
        })
    }

    padClicked() {
        if (!this.isReadOnly) {
            this.popoverTrigger().openPopover();

            eventBus.on('instanceClosed', (id) => {
                if (id === this.component.id) {
                    this.popoverTrigger().closePopover();
                    if (this.img()) {
                        this.img()!.nativeElement.src = this.instance().dataValue;
                    }
                }
            });
        }
    }
}

