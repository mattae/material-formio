// @ts-nocheck
import { BuilderInfo, Builders, Components, ExtendedComponentSchema } from 'formiojs';
import { FormioCustomComponentInfo, FormioCustomElement, FormioEvent } from './elements.common';
import { eventBus } from "./formio.service";
import _, { clone, isArray, isNil } from 'lodash';
import _Wizard from 'formiojs/Wizard';
import _PDF from 'formiojs/PDF';
import _PDFBuilder from 'formiojs/PDFBuilder';
import _WizardBuilder from 'formiojs/WizardBuilder';
import _WebformBuilder from 'formiojs/WebformBuilder';
import _Displays from 'formiojs/displays/Displays';
import _Component from 'formiojs/components/_classes/component/Component';

const InputComponent = Components.components.input;
const TextfieldComponent = Components.components.textfield;
const WizardComponent = _Wizard['default'] || _Wizard;
const PDF = _PDF['default'] || _PDF;
const PDFBuilder = _PDFBuilder['default'] || _PDFBuilder;
const WizardBuilder = _WizardBuilder['default'] || _WizardBuilder;
const WebformBuilder = _WebformBuilder['default'] || _WebformBuilder;
const Displays = _Displays['default'] || _Displays;
const Component = _Component['default'] || _Component;

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
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
                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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
                return Component.prototype.render.call(this,
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

            get inputInfo() {
                return {
                    id: this.key,
                    ...this.elementInfo()
                };
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                    // Bind customOptions

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.id);
                    eventBus.emit('setInstance', null, this.id, this);

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        newCustomElement.Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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
                        this.onClick(event)
                    });

                    // Ensure we bind the value (if it isn't a multiple-value component with no wrapper)
                    if (!this._customAngularElement.value && !this.component.disableMultiValueWrapper) {
                        this.restoreValue();
                    }

                }
                this.on('submitButton', () => {
                    this._customAngularElement.setAttribute('event', 'submitButton');

                }, true);
                this.on('cancelSubmit', () => {
                    this._customAngularElement.setAttribute('event', 'cancelSubmit');
                }, true);
                this.on('submitDone', (message: any) => {
                    const resultMessage = _.isString(message) ? message : this.t('complete');
                    this._customAngularElement.setAttribute('event', 'submitDone');
                    this._customAngularElement.setAttribute('message', resultMessage);
                }, true);
                this.on('submitError', (message: any) => {
                    const resultMessage = _.isString(message) ? this.t(message) : this.t(this.errorMessage('submitError'));
                    this._customAngularElement.setAttribute('event', 'submitError');
                    this._customAngularElement.setAttribute('message', resultMessage);
                }, true);
                this.on('change', (value: any, flags: any) => {
                    let isValid = value.isValid;
                    this._customAngularElement.setAttribute('event', 'change');
                    this._customAngularElement.setAttribute('valid', isValid);
                }, true);

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        newCustomElement.Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        return super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        return super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        return super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        return super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return super.attach(element);
            }

        }
        Builders.addBuilder('wizard', cls);
        return cls;
    }
    if (customComponentOptions.baseType === 'table') {
        return class MatTableComponent extends Components.components.table {
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'datagrid') {
        return class MatDatagridComponent extends Components.components.datagrid {
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'datamap') {
        return class MatDatamapComponent extends Components.components.datamap {
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
                return Component.prototype.render.call(this,
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'phoneNumber') {
        return class MatPhoneNumberComponent extends Components.components.phoneNumber {
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'editgrid') {
        return class MatEditgridComponent extends Components.components.editgrid {
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                //return superAttach;
            }
        };
    }
    if (customComponentOptions.baseType === 'currency') {
        return class MatCurrencyComponent extends Components.components.currency {
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

                // Bind the custom options and the validations to the Angular component's inputs (flattened)
                if (this._customAngularElement) {
                    // To make sure we have working input in IE...
                    // IE doesn't render it properly if it's not visible on the screen
                    // due to the whole structure applied via innerHTML to the parent
                    // so we need to use appendChild
                    if (!this._customAngularElement.getAttribute('ng-version')) {
                        this._customAngularElement.removeAttribute('ref');

                        const newCustomElement = document.createElement(customComponentOptions.selector) as FormioCustomElement;

                        newCustomElement.setAttribute('ref', 'input');
                        Object.keys(this.inputInfo.attr).forEach((attr: string) => {
                            newCustomElement.setAttribute(attr, this.inputInfo.attr[attr]);
                        });

                        this._customAngularElement.appendChild(newCustomElement);
                        this._customAngularElement = newCustomElement;

                        superAttach = super.attach(element);
                    }

                    this._customAngularElement.setAttribute('id', this.component.id);
                    eventBus.emit('setInstance', null, this.component.id, this);
                }

                return superAttach;
            }
        };
    }
}

