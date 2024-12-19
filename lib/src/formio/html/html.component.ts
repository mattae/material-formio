import { Component, effect, ElementRef, viewChild } from '@angular/core';
import { MaterialComponent } from '../material.component';
import _ from 'lodash';
import showdown from 'showdown';
import { marked } from 'marked';
import { Utils } from '@formio/js';
import Evaluator = Utils.Evaluator;

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
            if (this.instance() && this.htmlBody()) {
                this.instance().on('change', () => {
                    console.log('this.instance().renderContent()', this.instance().renderContent())
                    this.htmlBody().nativeElement.innerHTML = this.instance().renderContent();

                    console.log('this.htmlBody().nativeElement', this.htmlBody())
                })
            }
        });
    }

    get content() {
        if (this.instance().builderMode) {
            return this.component.content;
        }

        if (this.component.content.replace(/(<(\/?[^>]+)>)/g, '').trim() === 'select') {
            return ` ${this.component.content} `;
        }

        const submission = _.get(this.instance().root, 'submission', {});
        return this.component.content ? this.interpolate(
            this.instance().sanitize(this.component.content, this.instance().shouldSanitizeValue),
            {
                metadata: submission.metadata || {},
                submission: submission,
                data: this.instance().rootValue,
                row: this.instance().data
            }) : '';
    }

    interpolate(string: string, data: any): string {
        return showdown.render(string, this.instance().evalContext(data));
    }
}
