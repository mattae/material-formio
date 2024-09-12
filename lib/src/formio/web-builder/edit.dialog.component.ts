import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    ElementRef,
    Inject,
    inject,
    viewChild
} from '@angular/core';
import _ from 'lodash';
import { Components, Displays, Utils, Widgets } from 'formiojs';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle
} from '@angular/material/dialog';
import getComponent = Utils.getComponent;
import { uniquify } from './web-builder.component';

const Webform = Displays.getDisplay('webform');

@Component({
    selector: 'mat-formio-component-edit',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIcon,
        NgClass,
        MatButton,
        MatCard,
        MatCardHeader,
        MatCardContent,
        MatCardActions,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatDialogClose
    ],
    template: `
        @if (instance) {
            <div mat-dialog-title class="flex flex-row p-4 border-b border-primary">
                <div class="w-1/2">
                    <h2 class="lead">{{ instance.t(componentInfo?.title, {_userInput: true}) }}
                        {{ instance.t('Component') }}</h2>
                </div>
                <div class="w-1/2 flex flex-row justify-end">
                    @if (instance.helplinks && componentInfo) {
                        <div style="margin-right: 20px; margin-top: 10px">
                            <a href="{{instance.t(instance.helplinks + componentInfo.documentation)}}"
                               target="_blank" rel="noopener noreferrer">
                                <div
                                        class="pl-1 space-x-0.5 flex items-center justify-items-end">
                                    <mat-icon class="text-primary icon-size-4 pt-0.5"
                                              svgIcon="heroicons_outline:information-circle">
                                    </mat-icon>
                                    <div class="ml-1.5 leading-5 mr-auto pl-1 text-primary">
                                        {{ instance.t('Help') }}
                                    </div>
                                </div>
                            </a>
                        </div>
                    }
                </div>
            </div>
            <mat-dialog-content class="flex flex-row mat-typography shadow-md">
                <div [ngClass]="{
                    'w-1/2': instance.preview,
                    'w-full': !instance.preview,
                }">
                    <div #editForm></div>
                    @if (!instance.preview) {
                        <div class="mt-2.5">
                            <button mat-raised-button class="bg-green text-on-green"
                                    (click)="save()">{{ instance.t('Save') }}
                            </button>
                            <button mat-raised-button class="bg-secondary text-on-secondary"
                                    (click)="cancel()">{{ instance.t('Cancel') }}
                            </button>
                            <button mat-raised-button class="bg-error text-on-error"
                                    (click)="remove()">{{ instance.t('Remove') }}
                            </button>
                        </div>
                    }
                </div>
                @if (instance.preview) {
                    <div class="w-1/2">
                        <mat-card>
                            <mat-card-header>
                                <div class="border-b-2">
                                    {{ instance.t('Preview') }}
                                </div>
                            </mat-card-header>
                            <mat-card-content>
                                <div class="pt-2">
                                    <div #preview></div>
                                </div>
                                <mat-card-actions class="gap-x-1">
                                    <button mat-raised-button class="bg-green text-on-green"
                                            (click)="save()">{{ instance.t('Save') }}
                                    </button>
                                    <button mat-raised-button class="bg-secondary text-on-secondary"
                                            (click)="cancel()">{{ instance.t('Cancel') }}
                                    </button>
                                    <button mat-raised-button class="bg-error text-on-error"
                                            (click)="remove()">{{ instance.t('Remove') }}
                                    </button>
                                </mat-card-actions>
                            </mat-card-content>
                        </mat-card>
                    </div>
                }
            </mat-dialog-content>
            <mat-dialog-actions align="end" class="border-t border-primary">
                <button mat-raised-button mat-dialog-close>Cancel</button>
            </mat-dialog-actions>
        }
    `
})
export class MaterialComponentEditComponent {
    editForm = viewChild('editForm', {read: ElementRef});
    preview = viewChild('preview', {read: ElementRef});
    cdr = inject(ChangeDetectorRef);
    dialogRef = inject(MatDialogRef<MaterialComponentEditComponent>)
    componentInfo: any;
    instance: any;
    component: any;
    parent: any;
    isNew: boolean;
    isJsonEdit: boolean;
    original: any;
    flags: {};

    constructor(@Inject(MAT_DIALOG_DATA) public data: {
        instance: any,
        component: any,
        parent: any,
        isNew: boolean,
        isJsonEdit: boolean,
        original: any,
        flags: any
    }) {
        this.instance = data.instance;
        this.component = data.component;
        this.parent = data.parent;
        this.isNew = data.isNew;
        this.isJsonEdit = data.isJsonEdit;
        this.original = data.original;
        this.flags = data.flags;

        this.instance.dialog = {
            close: () => {
            }
        }

        this.instance.updateComponent = this.updateComponent.bind(this);

        effect(() => {
            if (this.editForm()) {
                this.initializeEditForm();
            }
        });
    }

    updateComponent(component, changed) {
        const sanitizeConfig = _.get(this.instance.webform, 'form.settings.sanitizeConfig') || _.get(this.instance.webform, 'form.globalSettings.sanitizeConfig');
        // Update the preview.
        if (this.instance.preview) {
            this.instance.preview.form = {
                components: [_.omit({...component}, [
                    'hidden',
                    'conditional',
                    'calculateValue',
                    'logic',
                    'autofocus',
                    'customConditional',
                ])],
                config: this.instance.options.formConfig || {},
                sanitizeConfig,
            };

            const fieldsToRemoveDoubleQuotes = ['label', 'tooltip'];

            this.instance.preview.form.components.forEach(component => this.instance.replaceDoubleQuotes(component, fieldsToRemoveDoubleQuotes));

            if (this.preview()) {
                this.preview()!.nativeElement.innerHTML = this.instance.preview.render();
                this.instance.preview.attach(this.preview()!.nativeElement);

                this.cdr.markForCheck();
            }
        }

        // Change the "default value" field to be reflective of this component.
        const defaultValueComponent = getComponent(this.instance.editForm.components, 'defaultValue', true);
        if (defaultValueComponent && component.type !== 'hidden') {
            const defaultChanged = changed && (
                (changed.component && changed.component.key === 'defaultValue')
                || (changed.instance && defaultValueComponent.hasComponent && defaultValueComponent.hasComponent(changed.instance))
            );

            if (!defaultChanged) {
                _.assign(defaultValueComponent.component, _.omit({...component}, [
                    'key',
                    'label',
                    'labelPosition',
                    'labelMargin',
                    'labelWidth',
                    'placeholder',
                    'tooltip',
                    'hidden',
                    'autofocus',
                    'validate',
                    'disabled',
                    'defaultValue',
                    'customDefaultValue',
                    'calculateValue',
                    'conditional',
                    'customConditional',
                    'id'
                ]));
                const parentComponent = defaultValueComponent.parent;
                let tabIndex = -1;
                let index = -1;
                parentComponent.tabs.some((tab, tIndex) => {
                    tab.some((comp, compIndex) => {
                        if (comp.id === defaultValueComponent.id) {
                            tabIndex = tIndex;
                            index = compIndex;
                            return true;
                        }
                        return false;
                    });
                });

                if (tabIndex !== -1 && index !== -1 && changed && !_.isNil(changed.value)) {
                    const sibling = parentComponent.tabs[tabIndex][index + 1];
                    parentComponent.removeComponent(defaultValueComponent);
                    const newComp = parentComponent.addComponent(defaultValueComponent.component, defaultValueComponent.data, sibling);
                    _.pull(newComp.validators, 'required');
                    parentComponent.tabs[tabIndex].splice(index, 1, newComp);
                    newComp.checkValidity = () => true;
                    newComp.build(defaultValueComponent.element);
                }
            } else {
                let dataPath = changed.instance._data.key;

                const path = Utils['getArrayFromComponentPath'](changed.instance.path);
                path.shift();

                if (path.length) {
                    path.unshift(component.key);
                    dataPath = Utils['getStringFromComponentPath'](path);
                }

                _.set(this.instance.preview._data, dataPath, changed.value);
                _.set(this.instance.webform._data, dataPath, changed.value);
            }
        }

        // Called when we update a component.
        this.instance.emit('updateComponent', component);
    }

    initializeEditForm(): void {

        this.instance.saved = false;
        const componentCopy = Utils['fastCloneDeep'](this.component);
        let ComponentClass = Components.components[componentCopy.type];
        const isCustom = ComponentClass === undefined;
        this.isJsonEdit = this.isJsonEdit || isCustom;
        ComponentClass = isCustom ? Components.components.unknown : ComponentClass;
        // Make sure we only have one dialog open at a time.
        if (this.instance.dialog) {
            this.instance.dialog.close();
            this.instance.highlightInvalidComponents();
        }

        // This is the render step.
        const editFormOptions: any = _.clone(_.get(this, 'options.editForm', {}));
        if (this.instance.editForm) {
            this.instance.editForm.destroy();
        }

        // Allow editForm overrides per component.
        const overrides = _.get(this.instance.options, `editForm.${componentCopy.type}`, {});

        // Pass along the form being edited.
        editFormOptions.editForm = this.instance.form;
        editFormOptions.editComponent = this.component;
        editFormOptions.flags = this.flags;

        this.instance.hook('editComponentParentInstance', editFormOptions, parent);

        this.instance.editForm = new Webform(
            {
                ..._.omit(this.instance.options, ['hooks', 'builder', 'events', 'attachMode', 'skipInit']),
                language: this.instance.options.language,
                ...editFormOptions,
                evalContext: {
                    ...(editFormOptions?.evalContext || this.instance.options?.evalContext || {}),
                    buildingForm: this.instance.form,
                },
            }
        );

        this.instance.hook('editFormProperties', parent);

        this.instance.editForm.form = (this.isJsonEdit && !isCustom) ? {
            components: [
                {
                    type: 'textarea',
                    as: 'json',
                    editor: 'ace',
                    weight: 10,
                    input: true,
                    key: 'componentJson',
                    label: 'Component JSON',
                    tooltip: 'Edit the JSON for this component.'
                },
                {
                    type: 'checkbox',
                    key: 'showFullSchema',
                    label: 'Full Schema'
                }
            ]
        } : ComponentClass.editForm(_.cloneDeep(overrides));
        const instanceOptions = {
            inFormBuilder: true,
        };

        this.instance.hook('instanceOptionsPreview', instanceOptions);

        const instance = new ComponentClass(componentCopy, instanceOptions);
        const schema = this.instance.hook('builderComponentSchema', this.component, instance);

        this.instance.editForm.submission = this.isJsonEdit ? {
            data: {
                componentJson: schema,
                showFullSchema: this.instance.options.showFullJsonSchema
            },
        } : {
            data: instance.component,
        };

        if (this.instance.preview) {
            this.instance.preview.destroy();
        }
        if (!ComponentClass.builderInfo.hasOwnProperty('preview') || ComponentClass.builderInfo.preview) {
            this.instance.preview = new Webform(_.omit({...this.instance.options, preview: true}, [
                'hooks',
                'builder',
                'events',
                'attachMode',
                'calculateValue'
            ]));

            this.instance.hook('previewFormSettitngs', schema, this.isJsonEdit);
        }

        this.componentInfo = ComponentClass.builderInfo;
        this.instance.showPreview = ComponentClass.builderInfo.showPreview ?? true;

        this.editForm()!.nativeElement.innerHTML = this.instance.editForm.render();
        this.instance.editForm.attach(this.editForm()!.nativeElement);

        this.cdr.markForCheck();

        this.instance.hook('editFormWrapper');

        this.instance.editForm.on('change', (event) => {
            if (event.changed) {
                if (event.changed.component && event.changed.component.key === 'showFullSchema') {
                    const {value} = event.changed;
                    this.instance.editForm.submission = {
                        data: {
                            componentJson: value ? instance.component : this.component,
                            showFullSchema: value
                        },
                    };
                    return;
                }
                // See if this is a manually modified key. Treat custom component keys as manually modified
                if ((event.changed.component && (event.changed.component.key === 'key')) || this.isJsonEdit) {
                    componentCopy.keyModified = true;
                }

                let isComponentLabelChanged = false;
                if (event.changed.instance) {
                    isComponentLabelChanged = ['label', 'title'].includes(event.changed.instance.path);
                } else if (event.changed.component) {
                    isComponentLabelChanged = ['label', 'title'].includes(event.changed.component.key);
                }

                if (isComponentLabelChanged) {
                    // Ensure this component has a key.
                    if (this.isNew) {
                        if (!event.data.keyModified) {
                            this.instance.editForm.everyComponent(component => {
                                if (component.key === 'key' && component.parent.component.key === 'tabs') {
                                    component.setValue(this.instance.updateComponentKey(event.data));
                                    return false;
                                }
                                return true;
                            });
                        }

                        if (this.instance.form) {
                            let formComponents = this.instance.findNamespaceRoot(this.parent.formioComponent);
                            // excluding component which key uniqueness is to be checked to prevent the comparing of the same keys
                            formComponents = formComponents.filter(comp => editFormOptions.editComponent.id !== comp.id);

                            // Set a unique key for this component.
                            uniquify(formComponents, event.data);
                        }
                    }
                }

                // If the edit form has any nested form inside, we get a partial data (nested form's data) in the
                // event.data property
                let editFormData: any;
                if (event.changed.instance && event.changed.instance.root && event.changed.instance.root.id !== this.instance.editForm.id) {
                    editFormData = this.instance.editForm.data;
                }

                // Update the component.
                this.updateComponent(event.data.componentJson || editFormData || event.data, event.changed);
            }
        });

        this.instance.emit('editComponent', this.component);

        this.updateComponent(componentCopy, {});
    }

    save() {
        if (!this.instance.editForm.checkValidity(this.instance.editForm.data, true, this.instance.editForm.data)) {
            this.instance.editForm.setPristine(false);
            this.instance.editForm.showErrors();
            return false;
        }
        this.instance.saved = true;
        this.instance.saveComponent(this.component, this.parent, this.isNew, this.original);
        this.dialogRef.close();

        return true;
    }

    cancel() {
        this.instance.editForm.detach();
        this.instance.emit('cancelComponent', this.component);
        this.dialogRef.close();

        this.instance.highlightInvalidComponents();
    }

    remove() {
        this.instance.saved = true;
        this.instance.editForm.detach();
        this.instance.removeComponent(this.component, this.parent, this.original);
        this.dialogRef.close();
        this.instance.highlightInvalidComponents();
    }
}
