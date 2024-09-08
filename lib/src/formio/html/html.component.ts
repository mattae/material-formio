import { Component, effect, ElementRef, viewChild } from '@angular/core';
import { MaterialComponent } from '../material.component';

@Component({
    selector: 'mat-formio-html',
    template: `
        <div #htmlBody></div>`,
    standalone: true
})
export class MaterialHtmlComponent extends MaterialComponent {
    htmlBody = viewChild('htmlBody', {read: ElementRef});

    constructor() {
        super();

        effect(() => {
            if (this.instance && this.htmlBody()) {
                this.htmlBody()!.nativeElement.innerHTML = this.instance.renderContent();
            }
        });
    }
}
