import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialComponent } from '../material.component';
import { Components } from 'formiojs';

Components.components.panel.prototype.render = function (...args) {
    return Components.components.base.prototype.render.call(this, ...args);
}

@Component({
    selector: 'mat-formio-panel',
    template: `
        @if (component) {
            @if (!component.collapsible) {
                <mat-card appearance="outlined">
                    @if (component?.title) {
                        <mat-card-header>
                            <mat-card-title>
                                {{ component.title | transloco }}
                            </mat-card-title>
                        </mat-card-header>
                    }
                    <mat-card-content>
                        <div class="flex flex-col" #content></div>
                    </mat-card-content>
                </mat-card>
            }
            @if (component.collapsible) {
                <mat-expansion-panel
                    [expanded]="!component.collapsed"
                >
                    @if (component?.title) {
                        <mat-expansion-panel-header >
                            <mat-panel-title>
                                {{ component.title | transloco }}
                            </mat-panel-title>
                        </mat-expansion-panel-header>
                    }
                    <div class="flex flex-col" #content></div>
                </mat-expansion-panel>
            }
        }
    `,
    styles: [
        ':host { margin-bottom: 1em; @apply pt-2}'
    ],
    imports: [
        MatExpansionModule,
        MatCardModule,
        TranslocoModule
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialPanelComponent extends MaterialComponent {
    content = viewChild('content', {read: ElementRef});

    constructor() {
        super();
        effect(() => {
            this.initialize();
        })
    }

    initialize() {
        if (this.instance && this.content()) {
            const content = this.content()!.nativeElement;
            content.innerHTML = this.instance.renderComponents()
            this.instance.attachComponents(content);

            this.instance.root.on('beforeSetSubmission', ({data}) => {
                if (data) {
                    this.instance.setValue(data)
                }
            })
            this.cdr.markForCheck();
        }
    }
}
