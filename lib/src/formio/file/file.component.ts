import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild } from '@angular/core';
import { MaterialComponent } from '../material.component';
import { Components } from 'formiojs';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormioFormFieldComponent } from '../formio-form-field/formio-form-field.component';
import { LabelComponent } from '../label/label.component';
import { MatError, MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CovalentCommonModule } from '@covalent/core/common';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatProgressBar } from '@angular/material/progress-bar';
import BaseComponent from 'formiojs/components/_classes/component/Component';
import BMF from 'browser-md5-file';

/*Components.components.file.prototype.render = function (element) {
    return BaseComponent.prototype.render.call(this, element);
}*/


//handleFilesToUpload
@Component({
    selector: 'mat-formio-file',
    template: `
        @if (component) {
            <mat-formio-form-field [component]="component" [componentTemplate]="componentTemplate"></mat-formio-form-field>
            <ng-template #componentTemplate let-hasLabel>
                @if (hasLabel) {
                    <mat-label class="w-full">
                        <label [component]="component" matFormioLabel></label>
                    </mat-label>
                }
                <mat-card appearance="outlined">
                    <mat-card-content>
                        @if (!component.imageUpload) {
                            @if (component.options?.vpat) {
                                <div>{{(!component.filePattern || component.filePattern === '*') ? 'Any file types are allowed' : 'Allowed file types: ' + component.filePattern}}</div>
                            }
                            <div class="flex flex-row border-b border-primary pb-3">
                                @if (!component.disabled) {
                                    <div class="w-1/12"></div>
                                }
                                <div [class]="fileNameClass">
                                    <strong>File Name</strong>
                                </div>
                                <div class="w-2/12">
                                    <strong>Size</strong>
                                </div>
                                @if (component.hasTypes) {
                                    <div class="w-2/12">
                                        <strong>Type</strong>
                                    </div>
                                }
                            </div>
                            <div class="flex flex-row">
                                <mat-list>
                                    @for (file of instance.dataValue; track file) {
                                        <mat-list-item>
                                            <div class="flex flex-row">
                                                @if (!component.disabled) {
                                                    <div class="w-1/12">
                                                        <button mat-button tabindex="0" [attr.ref]="'removeLink'" class="text-error">
                                                            <mat-icon svgIcon="heroicons_outline:trash" aria-hidden="false" aria-label="Remove row"></mat-icon>
                                                        </button>
                                                    </div>
                                                }
                                                <div [class]="fileNameClass">
                                                    @if(component.uploadOnly) {
                                                        {{file.originalName || file.name}}
                                                    } @else {
                                                        <a href="{{file.url || '#'}}" target="_blank" (click)="getFile(file)" >
                                                            <span class="sr-only">Press to open</span>{{file.originalName || file.name}}
                                                        </a>
                                                    }
                                                </div>
                                                <div class="w-2/12">
                                                    {{instance.fileSize(file.size)}}
                                                </div>
                                                @if (component.hasTypes && !instance.disabled) {
                                                    <div class="w-2/12">
                                                        <mat-form-field>
                                                            <mat-select [value]="file.fileType">
                                                                @for (type of component.fileTypes; track type) {
                                                                    <mat-option [value]="type.value">{{type.label | transloco}}</mat-option>
                                                                }
                                                            </mat-select>
                                                        </mat-form-field>
                                                    </div>
                                                }
                                                @if (component.hasTypes && instance.disabled) {
                                                    {{file.fileType}}
                                                }
                                            </div>
                                        </mat-list-item>
                                    }
                                </mat-list>
                            </div>
                        } @else {
                            <div>
                                @for (file of instance.dataValue; track file) {
                                    <div>
                                        <span>
                                            <img ref="fileImage" src="" alt="{{file.originalName || file.name}}" [ngStyle]="{width: component.imageSize + 'px'}" >
                                            @if (!instance.disabled) {
                                                <button mat-button tabindex="0" (click)="removeFile(file)" class="text-error">
                                                    <mat-icon svgIcon="heroicons_outline:trash" aria-hidden="false" aria-label="Remove row"></mat-icon>
                                                </button>
                                            }
                                        </span>
                                    </div>
                               }
                            </div>
                        }
                        @if (!instance.disabled && (component.multiple || !instance.dataValue?.length)) {
                            @if (instance.useWebViewCamera) {
                                 <div class="fileSelector">
                                     <button mat-button tabindex="0" (click)="browseGallery($event)" class="text-primary">
                                         <mat-icon svgIcon="heroicons_outline:book-open" aria-hidden="false" ></mat-icon>
                                     </button>
                                     <button mat-button tabindex="0" (click)="browseCamera()" class="text-primary">
                                         <mat-icon svgIcon="heroicons_outline:trash" aria-hidden="false"></mat-icon>
                                     </button>
                                 </div>
                            } @else if (!component.cameraMode) {
                                <div #dropzone class="fileSelector"  [ngClass]="{'hidden': instance.fileDropHidden}"
                                    (dragover)="dragover($event)"
                                    (dragleave)="dragleave()"
                                    (drop)="drop($event)">
                                    <div class="flex items-center justify-center">
                                        <mat-icon svgIcon="heroicons_outline:cloud-arrow-up" class="icon-size-6 ml-auto text-primary"></mat-icon>
                                        <div class="ml-1.5 leading-5 mr-auto">
                                            {{ instance.t('Drop files to attach,') }}
                                            @if (component.imageUpload && component.webcam) {
                                                <button mat-button (click)="toggleCameraMode()"><mat-icon svgIcon="heroicons_outline:camera"></mat-icon>
                                                    {{ instance.t('use camera') }}</button>
                                            }
                                            or
                                            <a class="browse" (click)="browseFile()">
                                                {{instance.t('browse')}}
                                                <span class="sr-only">
                                                    {{srDescription}}
                                                </span>
                                            </a>
                                            <div #fileProcessingLoader class="loader-wrapper">
                                                <div class="loader text-center"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            } @else {
                                <div class="video-container">
                                    <video class="video" autoplay="true" #videoPlayer tabindex="-1"></video>
                                </div>
                                <button mat-button color="primary" (click)="takePicture()"><mat-icon svgIcon="heroicons_outline:camera"/> {{instance.t('Take Picture')}}</button>
                                <button mat-button color="primary" (click)="toggleCameraMode()">{{instance.t('Switch to file upload') }}</button>
                            }
                        }
                        @for (status of instance.statuses; track status) {
                            <div class="file {{instance.statuses.status === 'error' ? ' has-error' : ''}}">
                                <div class="flex flex-row">
                                    <div class="fileName col-form-label w-10/12">
                                        {{status.originalName}}
                                        <button mat-icon-button>
                                            <mat-icon svgIcon="heroicons_outline:trash" aria-hidden="false" aria-label="Remove row"></mat-icon>
                                            <span class="sr-only">{{instance.t('Remove button. Press to remove ' + status.originalName || status.name + '.')}}</span>
                                            <span class="sr-only">{{status.message ? status.message.replace(';', '.') : ''}}</span>
                                        </button>
                                    </div>
                                    <div class="fileSize col-form-label w-2/12 text-right">{{instance.fileSize(status.size)}}</div>
                                </div>
                                <div class="flex flex-row">
                                    <div class="w-full">
                                    @if (status.status === 'progress') {
                                        <div class="progress">
                                            <mat-progress-bar [value]="status.progress" mode="buffer">
                                                <span class="sr-only">{{status.progress}}% {{instance.t('Complete')}}</span>
                                            </mat-progress-bar>
                                        </div>
                                    } @else if (status.status === 'error') {
                                        <div class="alert alert-danger bg-{{status.status}}">{{instance.t(status.message)}}</div>
                                    } @else {
                                        <div class="bg-{{status.status}}">{{instance.t(status.message)}}</div>
                                    }
                                    </div>
                                </div>
                            </div>
                        }
                    </mat-card-content>
                </mat-card>
            </ng-template>
        }
    `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCard,
        MatCardContent,
        FormioFormFieldComponent,
        LabelComponent,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        MatPrefix,
        MatSuffix,
        ReactiveFormsModule,
        TranslocoPipe,
        MatList,
        MatListItem,
        MatButton,
        MatIcon,
        CovalentCommonModule,
        MatSelect,
        MatOption,
        MatIconButton,
        MatProgressBar
    ]
})
export class MaterialFileComponent extends MaterialComponent {
    dropzone = viewChild('dropzone', {read: ElementRef});
    videoPlayer = viewChild('videoPlayer', {read: ElementRef});
    fileProcessingLoader = viewChild('fileProcessingLoader', {read: ElementRef});

    constructor() {
        super();

        effect(() => {
            if (this.instance) {
                this.initialize()
            }
        })
    }

    get fileNameClass() {
        return this.component.hasTypes ? 'w-7/12' : 'w-9/12';
    }

    get srDescription() {
        return 'Browse to attach file for ' + this.component.label + '. ' + (this.component.description ? this.component.description + '. ' : '') +
        ((!this.component.filePattern || this.component.filePattern === '*') ? 'Any file types are allowed' : 'Allowed file types: ' + this.component.filePattern)
    }

    initialize() {
        const instance = this.instance ;
        if (this.videoPlayer()) {
            instance.refs['videoPlayer'] = this.videoPlayer().nativeElement;
        }

        console.log('Instance', instance, this.dropzone(), this.videoPlayer());
    }

    browseFile() {
        this.instance.browseFiles(this.instance.browseOptions)
            .then((files) => {
                console.log('Files', files,  this.instance.handleFilesToUpload);
                try {
                    this.handleFilesToUpload(files);
                }catch (e) {
                    console.error('Handle error', e);
                }

                this.cdr.markForCheck();
            });

    }

    getFile(file) {
        this.instance.getFile(file);
        this.cdr.markForCheck();
    }

    removeFile(file) {
        this.instance.handleFileToRemove(file);

        this.cdr.markForCheck();
    }

    dragover(event) {
        event.preventDefault();
        console.log('Dragover');
        this.dropzone().nativeElement.className = 'fileSelector fileDragOver';

        this.cdr.markForCheck();
    }

    dragleave() {
        console.log('Dragleave');
        this.dropzone().nativeElement.className = 'fileSelector';

        this.cdr.markForCheck();
    }

    drop(event: any) {
        event.preventDefault();
        console.log('Drop', event, event.dataTransfer.files);
        this.dropzone().nativeElement.className = 'fileSelector';

        this.instance.handleFilesToUpload(event.dataTransfer.files)

        this.cdr.markForCheck();
    }

    browseGallery(evt) {

    }

    browseCamera() {}

    takePicture() {
        this.instance.takePicture();

        this.cdr.markForCheck();
    }

    toggleCameraMode() {
        this.instance.cameraMode = !this.instance.cameraMode;

        this.cdr.markForCheck();
    }

    async prepareFilesToUpload(files) {
        // Only allow one upload if not multiple.
        if (!this.component.multiple) {
            files = Array.prototype.slice.call(files, 0, 1);
        }

        if (this.component.storage && files && files.length) {
            this.instance.fileDropHidden = true;

            return Promise.all([...files].map(async(file) => {
                await this.prepareFileToUpload(file);
            }));
        }
        else {
            return Promise.resolve();
        }
    }

    async handleFilesToUpload(files) {
        await this.prepareFilesToUpload(files);
        if (!this.instance.autoSync) {
            await this.syncFiles();
        }
    }

    async triggerFileProcessor(file) {
        let processedFile = null;

        if (this.instance.root.options.fileProcessor) {
            try {
                if (this.fileProcessingLoader()) {
                    this.fileProcessingLoader().nativeElement.style.display = 'block';
                }
                const fileProcessorHandler = this.fileProcessor(this.instance.fileService, this.instance.root.options.fileProcessor);
                processedFile = await fileProcessorHandler(file, this.component.properties);
            }
            catch (err) {
                this.instance.fileDropHidden = false;
                return {
                    status: 'error',
                    message: this.instance.t('File processing has been failed.'),
                };
            }
            finally {
                if (this.fileProcessingLoader()) {
                    this.fileProcessingLoader().nativeElement.style.display = 'none';
                }
            }
        }

        return {
            file: processedFile,
        };
    }

    getInitFileToSync(file) {
        console.log('Init file', file, this.instance);
        const escapedFileName = file.name ? file.name.replaceAll('<', '&lt;').replaceAll('>', '&gt;') : file.name;
        const createRandomString = () => Math.random().toString(36).substring(2, 15);
        return {
            id: createRandomString(),
            // Get a unique name for this file to keep file collisions from occurring.
            dir: this.instance.interpolate(this.component.dir || ''),
            name: this.instance.getFileName(file),
            originalName: escapedFileName,
            fileKey: this.component.fileKey || 'file',
            storage: this.component.storage,
            options: this.component.options,
            file,
            size: file.size,
            status: 'info',
            message: this.instance.t('Processing file. Please wait...'),
            hash: '',
            isValidationError: false,
        };
    }

    async prepareFileToUpload(file) {
        const fileToSync = this.getInitFileToSync(file);
        fileToSync.hash = (await this.handleSubmissionRevisions(file) as string);

        const { status, message } = this.instance.validateFile(file);
        if (status === 'error') {
            fileToSync.isValidationError = true;
            fileToSync.status = status;
            fileToSync.message = message;
            return this.instance.filesToSync.filesToUpload.push(fileToSync);
        }

        if (this.component.privateDownload) {
            file.private = true;
        }

        const { groupKey, groupPermissions } = this.instance.getGroupPermissions();

        const processedFile = await this.triggerFileProcessor(file);
        if (processedFile.status === 'error') {
            fileToSync.status == 'error';
            fileToSync.message = processedFile.message;
            return this.instance.filesToSync.filesToUpload.push(fileToSync);
        }

        if (this.instance.autoSync) {
            fileToSync.message = this.instance.t('Ready to be uploaded into storage');
        }

        this.instance.filesToSync.filesToUpload.push({
            ...fileToSync,
            message: fileToSync.message,
            file: processedFile.file || file,
            url: this.instance.interpolate(this.component.url, { file: fileToSync }),
            groupPermissions,
            groupResourceId: groupKey ? this.instance.currentForm.submission.data[groupKey]._id : null,
        });
    }

    async syncFiles() {
        this.instance.isSyncing = true;
        this.instance.fileDropHidden = true;
        try {
            const [filesToDelete = [], filesToUpload = []] = await Promise.all([this.instance.delete(), this.instance.upload()]);
            this.instance.filesToSync.filesToDelete = filesToDelete
                .filter(file => file.fileToSync?.status === 'error')
                .map(file => file.fileToSync);
            this.instance.filesToSync.filesToUpload = filesToUpload
                .filter(file => file.fileToSync?.status === 'error')
                .map(file => file.fileToSync);

            if (!this.instance.hasValue()) {
                this.instance.dataValue =[];
            }

            const data = filesToUpload
                .filter(file => file.fileToSync?.status === 'success')
                .map(file => file.fileInfo);
            this.instance.dataValue.push(...data);
            this.instance.triggerChange();
            return Promise.resolve();
        }
        catch (err) {
            return Promise.reject();
        }
        finally {
            this.instance.isSyncing = false;
            this.instance.fileDropHidden = false;
            this.instance.abortUploads = [];
        }
    }

    async handleSubmissionRevisions(file) {
        if (this.instance.root.form.submissionRevisions !== 'true') {
            return '';
        }

        const bmf = new BMF();
        const hash = await new Promise((resolve, reject) => {
            this.instance.emit('fileUploadingStart');
            bmf.md5(file, (err, md5)=>{
                if (err) {
                    return reject(err);
                }
                return resolve(md5);
            });
        });
        this.instance.emit('fileUploadingEnd');

        return hash;
    }

    fileProcessor = (formio, config) => (file, options) =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Fire on network error.
            xhr.onerror = (err) => {
                // @ts-ignore
                err.networkError = true;
                reject(err);
            };

            // Fire on network abort.
            xhr.onabort = (err) => {
                // @ts-ignore
                err.networkError = true;
                reject(err);
            };

            // Fired when the response has made it back from the server.
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const mimetype = xhr.getResponseHeader('Content-Type') || file.type;
                    resolve(new File([xhr.response], file.name, { type: mimetype }));
                }
                else {
                    reject(xhr.response || 'Unable to process file');
                }
            };

            // Set the onabort error callback.
            xhr.onabort = reject;

            xhr.open('POST', config.url);
            const token = formio.getToken();
            if (token) {
                xhr.setRequestHeader('x-jwt-token', token);
            }
            xhr.responseType = 'arraybuffer';

            const data = new FormData();
            data.append('file', file);
            data.append('processorOptions', JSON.stringify(config.options || {}));
            data.append('options', JSON.stringify(options || {}));

            // Get the request and send it to the server.
            xhr.send(data);
        });
}
