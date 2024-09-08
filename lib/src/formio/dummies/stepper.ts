import { Component } from "@angular/core";
import { MatStep, MatStepper } from "@angular/material/stepper";

@Component({
    selector: 'fio-dummy-stepper',
    standalone: true,
    imports: [
        MatStep,
        MatStepper
    ],
    template: `
        <div class="hidden pt-2">
            <mat-stepper #stepper>
                <mat-step>
                </mat-step>
            </mat-stepper>
        </div>
    `
})
export class DummyStepper {

}
