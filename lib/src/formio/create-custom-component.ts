// @ts-nocheck
import { BuilderInfo, Builders, Components, Displays, ExtendedComponentSchema } from '@formio/js';
import { FormioCustomComponentInfo, FormioCustomElement, FormioEvent } from './elements.common';
import { eventBus } from "./formio.service";
import _, { clone, isArray, isNil } from 'lodash';

const InputComponent = Components.components.input;
const TextfieldComponent = Components.components.textfield;

const PDF = Displays.getDisplay('pdf');
const WizardComponent = Displays.getDisplay('wizard');
const PDFBuilder = Builders.getBuilder('pdf');
const WebformBuilder = Builders.getBuilder('webform');
const WizardBuilder = Builders.getBuilder('wizard');

export function createCustomFormioComponent(customComponentOptions: FormioCustomComponentInfo) {
    if (!customComponentOptions.baseType || customComponentOptions.baseType === 'input') {
        return class MatInputComponent extends InputComponent {
            static editForm = customComponentOptions.editForm || TextfieldComponent.editForm;
            type = customComponentOptions.type;
            _customAngularElement: FormioCustomElement;

            constructor(public component: ExtendedComponentSchema, options: any, data: any) {
                super(component, {
                    ...options,
                    sanitizeConfig: {
                        addTags: [customComponentOptions.selector],
                    },
                }, data);

                this.isMaterial = true;

                if (customComponentOptions.extraValidators) {
                    this.validators = this.validators.concat(customComponentOptions.extraValidators);
                }
            }

            static get builderInfo(): BuilderInfo {
                return {
                    title: customComponentOptions.title,
                    group: customComponentOptions.group,
                    icon: customComponentOptions.icon,
                    weight: customComponentOptions.weight,
                    documentation: customComponentOptions.documentation,
                    schema: MatInputComponent.schema(),
                };
            }

            get defaultSchema() {
                return MatInputComponent.schema();
            }

            get emptyValue() {
                return customComponentOptions.emptyValue || null;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            get defaultValue() {
                let defaultValue = this.emptyValue;

                // handle falsy default value
                if (!isNil(this.component.defaultValue)) {
                    defaultValue = this.component.defaultValue;
                }

                if (this.component.customDefaultValue && !this.options.preview) {
                    defaultValue = this.evaluate(
                        this.component.customDefaultValue,
                        {value: ''},
                        'value'
                    );
                }

                return clone(defaultValue);
            }

            static schema() {
                return InputComponent.schema({
                    ...customComponentOptions.schema,
                    type: customComponentOptions.type,
                });
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                    // Bind customOptions
                    for (const key in this.component.customOptions) {
                        if (this.component.customOptions.hasOwnProperty(key)) {
                            this._customAngularElement[key] = this.component.customOptions[key];
                        }
                    }
                    // Bind validate options
                    for (const key in this.component.validate) {
                        if (this.component.validate.hasOwnProperty(key)) {
                            this._customAngularElement[key] = this.component.validate[key];
                        }
                    }
                    // Bind options explicitly set
                    const fieldOptions = customComponentOptions.fieldOptions;
                    if (isArray(fieldOptions) && fieldOptions.length > 0) {
                        for (const key in fieldOptions) {
                            if (fieldOptions.hasOwnProperty(key)) {
                                this._customAngularElement[fieldOptions[key]] = this.component[fieldOptions[key]];
                            }
                        }
                    }

                    // Attach event listener for emit event
                    this._customAngularElement.addEventListener('formioEvent', (event: CustomEvent<FormioEvent>) => {
                        this.emit(event.detail.eventName, {
                            ...event.detail.data,
                            component: this.component
                        });

                        this.setValue(event.detail.data)
                    });

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }

            // Add extra option to support multiple value (e.g. datagrid) with single angular component (disableMultiValueWrapper)
            useWrapper() {
                return this.component.hasOwnProperty('multiple') && this.component.multiple && !this.component.disableMultiValueWrapper;
            }
        };
    }
    if (customComponentOptions.baseType === 'password') {
        return class MatPasswordComponent extends Components.components.password {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'checkbox') {
        return class MatCheckboxComponent extends Components.components.checkbox {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'datetime') {
        return class MatDatetimeComponent extends Components.components.datetime {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'textfield') {
        return class MatTextfieldComponent extends Components.components.textfield {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.attr = {
                    ...info.attr
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            checkInputMaskValue(inputMask) {

            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'htmlelement') {
        return class MatHTMLElementComponent extends Components.components.htmlelement {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return Components.components.base.prototype.render.call(this,
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'email') {
        return class MatEmailComponent extends Components.components.email {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,

                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'tags') {
        return class MatTagsComponent extends Components.components.tags {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            attachElement(element, index) {
                return Components.components.multivalue.prototype.attachElement.call(this, element, index);
            }

            redraw(): any {
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'survey') {
        return class MatSurveyComponent extends Components.components.survey {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return Components.components.base.prototype.render.call(this,
                    `
                       <div>
                            ${this.renderTemplate('input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'time') {
        return class MatTimeComponent extends Components.components.time {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'signature') {
        return class MatSignatureComponent extends Components.components.signature {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'selectboxes') {
        return class MatSelectboxComponent extends Components.components.selectboxes {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return Components.components.base.prototype.render.call(this,
                    `
                       <div>
                            ${this.renderTemplate('input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'day') {
        return class MatDayComponent extends Components.components.day {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'url') {
        return class MatUrlComponent extends Components.components.url {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'address') {
        return class MatAddressComponent extends Components.components.address {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'panel') {
        return class MatPanelComponent extends Components.components.panel {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {
                            input: info
                        }
                    )
                    }
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'fieldset') {
        return class MatFieldsetComponent extends Components.components.fieldset {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {
                            input: info
                        }
                    )
                    }
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'number') {
        return class MatNumberComponent extends Components.components.number {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            get defaultValue() {
                let defaultValue = super.defaultValue;
                if (this.component.multiple && _.isArray(defaultValue)) {
                    defaultValue = !defaultValue[0] && defaultValue[0] !== 0 ? [0] : defaultValue[0];
                }
                return defaultValue;
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'radio') {
        return class MatRadioComponent extends Components.components.radio {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            static editForm = customComponentOptions.editForm || Components.components.radio.editForm;

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return Components.components.base.prototype.render.call(this,
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'select') {
        return class MatSelectComponent extends Components.components.select {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            editForm = Components.components.select.editForm;

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'button') {
        return class MatButtonComponent extends Components.components.button {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                this._customAngularElement = element.querySelector(customComponentOptions.selector);
                if (!this._customAngularElement && this.visible) {
                    const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                    newCustomElement.setAttribute('ref', 'input');
                    Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                        newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                    });

                    element.appendChild(newCustomElement);
                    this._customAngularElement = newCustomElement;
                }
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'tabs') {
        return class MatTabsComponent extends Components.components.tabs {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {
                            input: info
                        }) }
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {

                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'textarea') {
        return class MatTextareaComponent extends Components.components.textarea {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        }
    }
    if (customComponentOptions.baseType === 'file') {
        return class MatFileComponent extends Components.components.file {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        }
    }
    if (customComponentOptions.baseType === 'wizard') {
        const cls = class MatWizardComponent extends WizardComponent {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);

                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }
                return superAttach;
            }
        }
        Displays.addDisplay('wizard', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'pdf') {
        const cls = class MatPdfComponent extends PDF {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(children: any): any {
                return `
                    <div ref='webform'>
                        <mat-fio-pdf></mat-fio-pdf>
                    </div>
                `
            }

            attach(element: HTMLElement) {
                this.options = this.options || {};
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return super.attach(element);
            }
        }
        Displays.addDisplay('pdf', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'pdf-builder') {
        const cls = class MatPdfBuilderComponent extends PDFBuilder {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(children: any): any {
                return `
                    <div ref='webform'>
                        <mat-fio-pdf-builder></mat-fio-pdf-builder>
                    </div>
                `
            }

            attach(element: HTMLElement) {
                this.options = this.options || {};
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return super.attach(element);
            }

        }
        Builders.addBuilder('pdf', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'webform-builder') {
        const cls = class MatWebformBuilderComponent extends WebformBuilder {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(children: any): any {
                return `
                    <div ref='webform'>
                        <mat-fio-webform-builder></mat-fio-webform-builder>
                    </div>
                `
            }

            attach(element: HTMLElement) {
                this.options = this.options || {};
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return super.attach(element);
            }

        }
        Builders.addBuilder('webform', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'wizard-builder') {
        const cls = class MatWizardBuilderComponent extends WizardBuilder {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(children: any): any {
                return `
                    <div ref='webform'>
                        <mat-fio-wizard-builder></mat-fio-wizard-builder>
                    </div>
                `
            }

            attach(element: HTMLElement) {
                this.options = this.options || {};
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return super.attach(element);
            }

        }
        Builders.addBuilder('wizard', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'table') {
        return class MatTableComponent extends Components.components.table {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'well') {
        return class MatWellComponent extends Components.components.well {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'datagrid') {
        return class MatDatagridComponent extends Components.components.datagrid {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'datamap') {
        return class MatDatamapComponent extends Components.components.datamap {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return Components.components.base.prototype.render.call(this,
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'phoneNumber') {
        return class MatPhoneNumberComponent extends Components.components.phoneNumber {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'editgrid') {
        return class MatEditgridComponent extends Components.components.editgrid {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }


            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'multivalue') {
        return class MatMultivalueComponent extends Components.components.multivalue {
            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                return info;
            }

            render(): any {
                const info = this.inputInfo;
                return super.render(
                    `
                       <div>
                            ${this.renderTemplate(customComponentOptions.template || 'input', {input: info})}
                       </div>
                    `
                );
            }

            attach(element: HTMLElement) {
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                //return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'currency') {
        return class MatCurrencyComponent extends Components.components.currency {
            constructor(...args) {
                super(...args);
                this.isMaterial = true;
            }

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
            }

            elementInfo() {
                const info = super.elementInfo();
                info.type = customComponentOptions.selector;
                info.changeEvent = customComponentOptions.changeEvent || 'valueChange';
                info.attr = {
                    ...info.attr,
                    class: info.attr.class.replace('form-control', 'form-control-custom-field') // remove the form-control class as the custom angular component may look different
                };
                return info;
            }

            renderElement(value: any, index: number) {
                const info = this.inputInfo;
                return this.renderTemplate(customComponentOptions.template || 'input', {
                    input: info,
                    value,
                    index
                });
            }

            attach(element: HTMLElement) {
                let superAttach = super.attach(element);
                this._customAngularElement = element.querySelector(customComponentOptions.selector);

                if (this._customAngularElement) {
                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }
                }

                return superAttach;
            }
        };
    }
}

