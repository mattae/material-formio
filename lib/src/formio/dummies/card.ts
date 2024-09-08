import { Component } from '@angular/core';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'fio-dummy-card',
    standalone: true,
    imports: [
        MatCard,
        MatCardHeader,
        MatCardContent,
        MatCardTitle,
        MatCardActions
    ],
    template: `
        <mat-card class="hidden">
            <mat-card-header>
                <mat-card-title></mat-card-title>
            </mat-card-header>
            <mat-card-content></mat-card-content>
            <mat-card-actions></mat-card-actions>
        </mat-card>
    `
})
export class DummyCard {}
