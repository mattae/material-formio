import { ChangeDetectionStrategy, Component, effect, ElementRef, signal, viewChild, viewChildren } from '@angular/core';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MaterialComponent } from '../material.component';
import { AsyncPipe, NgStyle } from '@angular/common';
import Wizard from 'formiojs/Wizard';
import BaseComponent from 'formiojs/components/_classes/component/Component';

Wizard.prototype.render = function (...args) {
    return BaseComponent.prototype.render.call(this, ...args);
}

Wizard.prototype.attach = function (...args) {
    return BaseComponent.prototype.attach.call(this, ...args);
}

@Component({
    selector: 'mat-formio-wizard',
    template: `
        @if (instance){
        <mat-stepper>
            @for (page of pages ; track trackedBy(page)) {
                <mat-step [label]="page.component.title">
                    <div class="p-2 pt-3"  #components></div>
                    <div class="flex flex-row gap-x-0.5">
                        @for (button of buttonOrder; track trackedBy(button)) {
                            @if (button === 'cancel' && buttons.cancel) {
                                <button mat-button
                                        (click)="resetWizard()">Cancel
                                </button>
                            }
                            @if (button === 'previous' && buttons.previous) {
                                <button mat-raised-button color="primary"
                                        (click)="prevPage()">Previous
                                </button>
                            }
                            @if (button === 'next' && buttons.next) {
                                <button mat-raised-button
                                        color="primary" (click)="nextPage()">
                                    Next
                                </button>
                            }
                            @if (button === 'submit' && buttons.submit) {
                                <button mat-raised-button
                                        color="primary" (click)="submit()">
                                    Submit
                                </button>
                            }
                        }
                    </div>
                </mat-step>
            }
        </mat-stepper>
        }`,
    imports: [
        MatStepperModule,
        MatButtonModule,
        AsyncPipe,
        NgStyle
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialWizardComponent extends MaterialComponent {
    stepper = viewChild(MatStepper);
    components = viewChildren('components', {read: ElementRef});
    updated = signal<boolean>(true);
    buttonSettings: any;
    buttonOrder: any;
    buttons: any;
    pages: any[];
    selectedIndex = 0;

    constructor() {
        super();
        effect(() => {
            this.initialize();
        })
    }

    instanceInitialized(instance: any) {
        super.instanceInitialized(instance);
        this.instance.setValue({});
        const establishPages =  Wizard.prototype.establishPages;
        const _this = this;
        Wizard.prototype.establishPages = function (...args) {
            const result = establishPages.apply(this, args);
            const pages = this.allPages.length ? this.allPages : this.pages;
            _this.pages = pages;
            _this.cdr.markForCheck();

            _this.renderPages(pages);
            return result;
        }

        this.instance.on('pagesChanged', ()=> this.cdr.markForCheck())
    }

    initialize() {
        if (this.instance) {
            this.buttonSettings = this.instance.options.buttonSettings;
            this.buttonOrder = this.instance.renderContext.buttonOrder;
            this.buttons = this.instance.buttons;
            const instance = this.instance;

            if (this.stepper()) {
                this.stepper()!.selectedIndex = instance.page
            }
            if (this.components()) {
                const pages = instance.allPages.length ? this.instance.allPages : this.instance.pages;
                this.pages = pages;

               this.renderPages(pages);
            }
        }
    }

    renderPages(pages: any[]) {
        /*this.components().forEach((panel, index) => {
            const content = pages.map((page: any) => {
                return this.instance.renderComponents(page.components)
            });
            panel.nativeElement.innerHTML = content[index];
        })
        this.components().forEach((page, index) => {
            this.instance.attachComponents(page.nativeElement, pages[index].components, pages[index].component.components);
        });*/

        this.cdr.markForCheck()
    }

    resetWizard() {
        this.instance.cancel();
        this.stepper()!.reset();
    }

    nextPage() {
        this.instance.nextPage()
        this.stepper()!.next();
    }

    prevPage() {
        this.instance.prevPage()
        this.stepper()!.previous();
    }

    submit() {
        this.instance.submit();
    }

    trackedBy(page: any) {
        return page.id || page;
    }
}
