import { Component } from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
    selector: 'fio-dummy-dialog',
    standalone: true,
    imports: [
        MatDialogContent
    ],
    template: `
        <mat-dialog-content class="hidden"></mat-dialog-content>
    `
})
export class DummyDialog {
}
