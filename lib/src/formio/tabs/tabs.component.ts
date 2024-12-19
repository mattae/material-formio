import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChildren } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@jsverse/transloco';
import { NgStyle } from '@angular/common';
import { MaterialComponent } from '../material.component';
import { Components } from '@formio/js';

Components.components.tabs.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-tabs',
    imports: [
        MatTabsModule,
        TranslocoModule,
        NgStyle
    ],
    template: `
        @if (component) {
            <mat-tab-group (focusChange)="focusChange($event.index)"
                           animationDuration="200ms"
                           dynamicHeight>
                @for (tab of component.components; track tab) {
                    <mat-tab>
                        <ng-template mat-tab-label>
                            <div #labels>{{ tab.label | transloco }}</div>
                        </ng-template>
                    </mat-tab>
                }
            </mat-tab-group>
            @for (tab of component.components; track tab; let idx = $index) {
                <div [ngStyle]="{'display': idx !== tabIndex? 'none' : 'block'}" class="pt-2" #content></div>
            }
        }
    `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialTabsComponent extends MaterialComponent {
    tabIndex = 0;
    tabContents = viewChildren('content', {read: ElementRef});
    labels = viewChildren('labels', {read: ElementRef});

    constructor() {
        super();
        effect(() => {
            this.initialize();
        })

    }

    initialize() {
        if (this.instance() && this.tabContents()) {
            ['change', 'error'].forEach(event => this.instance().on(event, this.handleTabsValidation.bind(this)));
            this.tabContents().forEach((tab, index) => {
                const content = this.instance().tabs.map(tab => this.instance().renderComponents(tab));
                tab.nativeElement.innerHTML = content[index];
            })
            this.tabContents().forEach((tab, index) => {
                this.instance().attachComponents(tab.nativeElement, this.instance().tabs[index], this.instance().component.components[index].components);
            });
           // this.instance().setValue({})

            this.cdr.markForCheck();
        }
    }


    focusChange(index: number) {
        this.tabIndex = index;

        this.cdr.markForCheck();
    }

    handleTabsValidation() {

        const labels = this.labels().map(l => l.nativeElement);
        this.instance().clearErrorClasses(labels);
        this.cdr.markForCheck();

        const invalidTabsIndexes = this.instance().tabs.reduce((invalidTabs, tab, tabIndex) => {
            const hasComponentWithError = tab.some(comp => !!comp.error);
            return hasComponentWithError ? [...invalidTabs, tabIndex] : invalidTabs;
        }, []);

        if (!invalidTabsIndexes.length) {
            return;
        }

        const invalidTabs = [...labels].filter((_, tabIndex) => invalidTabsIndexes.includes(tabIndex));
        this.instance().setErrorClasses(invalidTabs);

        this.cdr.markForCheck();
    }
}
