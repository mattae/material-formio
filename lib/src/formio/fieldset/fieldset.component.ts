import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { MaterialPanelComponent } from '../panel/panel.component';

@Component({
    selector: 'mat-formio-fieldset',
    template: `
        @if (component) {
            <fieldset class="border border-solid border-gray-300 p-3 rounded-lg">
                <legend class="text-lg">
                    {{ component.legend | transloco}}
                </legend>
                <div class="flex flex-col" #content>
                </div>
            </fieldset>
        }
    `,
    styles: [],
    imports: [
        MatIconModule,
        MatFormFieldModule,
        MatTooltipModule,
        TranslocoModule,
    ],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialFieldsetComponent extends MaterialPanelComponent {
}
