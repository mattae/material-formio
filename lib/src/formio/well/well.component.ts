import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgStyle } from '@angular/common';
import { MaterialComponent } from "../material.component";

@Component({
    selector: 'mat-formio-well',
    template: `
        <mat-card [appearance]="'outlined'">
            <mat-card-content class="flex flex-col gap-1">
                <div #components></div>
            </mat-card-content>
        </mat-card>
    `,
    styles: [],
    imports: [
        MatCardModule,
        NgStyle
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialWellComponent  extends MaterialComponent {
    components = viewChild('components', {read: ElementRef});

    constructor() {
        super();

        effect(() => {
            if (this.instance && this.components()) {
                this.initialize();
            }
        })
    }

    initialize() {
        const content = this.components()!.nativeElement;
        content.innerHTML = this.instance.renderComponents();
        this.instance.attachComponents(content);

        this.cdr.markForCheck();
    }
}
