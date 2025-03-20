import { Directive, HostBinding, HostListener, input, Output, output, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface FileHandle {
    file: File;
    url: SafeUrl;
}

@Directive({
    selector: '[upload]',
    standalone: true,
})
export class DragUploadDirective {
    private sanitizer = inject(DomSanitizer);

    files = output<FileHandle[]>();
    accept = input<String>();
    multiple = input<boolean>();
    maxSize = input<number>();

    @HostBinding('style.background') private background = 'var(--mat-sys-surface-container)';
    @HostBinding('style.border') private border = '2px solid transparent';
    @HostBinding('style.border-color') private borderColor = 'transparent';
    @HostBinding('style.border-style') private borderStyle = 'solid';

    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);

    constructor() {
    }

    @HostListener('dragover', ['$event'])
    public onDragOver(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.background = 'var(--mat-sys-surface-container-low)';
        this.border = '2px dashed var(--mat-sys-primary)';
        this.borderColor = 'var(--mat-sys-primary)';
        this.borderStyle = 'dashed';
    }

    @HostListener('dragleave', ['$event'])
    public onDragLeave(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.background = 'var(--mat-sys-surface-container)';
        this.border = '2px solid transparent';
        this.borderColor = 'transparent';
        this.borderStyle = 'solid';
    }

    @HostListener('drop', ['$event'])
    public onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.background = 'var(--mat-sys-surface-container)';
        this.border = '2px solid transparent';
        this.borderColor = 'transparent';
        this.borderStyle = 'solid';

        let files: FileHandle[] = [];
        const fileList: FileList = this.filterMultipleFiles(
            // @ts-ignore
            evt.dataTransfer.files
        )!;
        if (fileList) {
            const accepted: File[] = this.filterSize(
                // @ts-ignore
                this.filterAcceptedTypes(Array.from(evt.dataTransfer.files))
            );
            for (let i = 0; i < accepted.length; i++) {
                // @ts-ignore
                const file = evt.dataTransfer.files[i];
                const url = this.sanitizer.bypassSecurityTrustUrl(
                    window.URL.createObjectURL(file)
                );
                files.push({file, url});
            }
            if (files.length > 0) {
                this.files.emit(files);
            }
        }
    }

    filterAcceptedTypes(files: File[]): File[] {
        const allowedFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!this.accept() || this.accept()!.includes(file.type)) {
                allowedFiles.push(file);
            }
        }
        return allowedFiles;
    }

    filterSize(files: File[]): File[] {
        const allowedFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!this.maxSize() || file.size <= this.maxSize()!) {
                allowedFiles.push(file);
            }
        }
        return allowedFiles;
    }

    filterMultipleFiles(files: FileList): FileList | undefined {
        if (!this.multiple() && files.length > 1) {
            return undefined;
        }
        return files;
    }
}
