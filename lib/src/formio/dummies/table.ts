import { Component } from "@angular/core";
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatTable
} from "@angular/material/table";

@Component({
    selector: 'fio-dummy-table',
    standalone: true,
    imports: [
        MatCell,
        MatCellDef,
        MatColumnDef,
        MatHeaderCell,
        MatHeaderRow,
        MatHeaderRowDef,
        MatRow,
        MatRowDef,
        MatTable,
        MatHeaderCellDef
    ],
    template: `
        @if (visible) {
            <div class="hidden">
                <mat-table [dataSource]="[]">
                    <ng-container matColumnDef="id">
                        <mat-header-cell *matHeaderCellDef></mat-header-cell>
                        <mat-cell *matCellDef="let row"> {{ row.id }}</mat-cell>
                    </ng-container>
                    <mat-header-row *matHeaderRowDef="['id']"></mat-header-row>
                    <mat-row *matRowDef="let row; columns: ['id']"></mat-row>
                </mat-table>
            </div>
        }
    `
})
export class DummyTable {
    visible = true;
}
