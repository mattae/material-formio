import { Injectable, Injector } from '@angular/core';
import { Components, Templates, Utils } from 'formiojs';
import { FormioCustomComponentInfo, FormioCustomTag } from './elements.common';
import { registerCustomComponent, registerCustomFormioComponent } from './register-custom-component';
import { MaterialCheckboxComponent } from './checkbox/checkbox.component';
import { MaterialTextfieldComponent } from './textfield/textfield.component';
import { MaterialTextareaComponent } from './textarea/textarea.component';
import { MaterialRadioComponent } from './radio/radio.component';
import { MaterialSelectComponent } from './select/select.component';
import { MaterialSelectBoxesComponent } from './selectboxes/selectboxes.component';
import { MaterialTagsComponent } from './tags/tags.component';
import { MaterialTimeComponent } from './time/time.component';
import { MaterialDateComponent } from './date/date.component';
import { MaterialNumberComponent } from './number/number.component';
import { MaterialCurrencyComponent } from './currency/currency.component';
import { MaterialPasswordComponent } from './password/password.component';
import { MaterialUrlComponent } from './url/url.component';
import { MaterialPhoneNumberComponent } from './phonenumber/phonenumber.component';
import { MaterialButtonComponent } from './button/button.component';
import { MaterialEmailComponent } from './email/email.component';
import { MaterialSurveyComponent } from './survey/survey.component';
import { LabelComponent } from './label/label.component';
import { MaterialIconComponent } from './icon/icon.component';
import { MaterialAddressComponent } from './address/address.component';
import { MaterialDayComponent } from './day/day.component';
import { MaterialTabsComponent } from './tabs/tabs.component';
import { MaterialPanelComponent } from './panel/panel.component';
import { DummyTable } from './dummies/table';
import { DummyStepper } from './dummies/stepper';
import { DummyCard } from './dummies/card';
import { MaterialWellComponent } from './well/well.component';
import { MaterialTableComponent } from './table/table.component';
import { MaterialDataGridComponent } from './datagrid/datagrid.component';
import { MaterialEditGridComponent } from './editgrid/editgrid.component';
import { MaterialFieldsetComponent } from './fieldset/fieldset.component';
import { MaterialFileComponent } from './file/file.component';
import { MaterialSignatureComponent } from './signature/signature.component';
import { MaterialDatamapComponent } from './datamap/datamap.component';
import { MaterialPdfComponent } from './pdf/pdf.component';
import { MaterialPdfBuilderComponent } from './pdf/pdf.builder.component';
import { MaterialWebBuilderComponent } from './web-builder/web-builder.component';
import { MaterialWizardBuilderComponent } from './wizard/wizard.builder.component';

import iconClass from './module/icons/iconClass';
import EventBus from 'js-event-bus';
import { MaterialHtmlComponent } from './html/html.component';
import _ from 'lodash';
import EditFormUtils = Components.EditFormUtils;
import baseEditForm = Components.baseEditForm;

const editForm = function(...extend) {
    const components = baseEditForm().components.map(cmp => {
        if (cmp.type === 'tabs') {
            cmp.components = cmp.components.map(c => {
                if (c.key === 'logic') {
                    c.components = c.components.map(c1 => {
                        if (c1.key === 'logic') {
                            c1.templates =  {
                                header: '<div class="row"><div class="col-sm-6"><strong>{{ value.length }} {{ ctx.t("Advanced Logic Configured") }}</strong></div></div>',
                                row: '<div class="row"><div class="col-sm-6"><div>{{ row.name }}</div></div></div> ',
                                footer: '',
                            }
                        }
                        if (c1.key === 'actions') {
                            c1.templates =  {
                                header: '<div class="row"><div class="col-sm-6"><strong>{{ value.length }} {{ ctx.t("actions") }}</strong></div></div>',
                                row: '<div class="row"><div class="col-sm-6"><div>{{ row.name }} </div></div></div> ',
                                footer: '',
                            }
                        }
                        return c1
                    })
                }
                return c;
            });
        }
        return cmp;
    }).concat(extend.map((items) => ({
        type: 'tabs',
        key: 'tabs',
        components: _.cloneDeep(items),
    })))
    return {
        components: _.unionWith(components, EditFormUtils.unifyComponents).concat({
            type: 'hidden',
            key: 'type'
        })
    };
}

Components.baseEditForm = editForm

Templates.current.iconClass = iconClass;

export const eventBus = new EventBus();

Utils.sanitize = (function (dirty, options) {
    return dirty;
})

const multivalueRender = Components.components.multivalue.prototype.render;
Components.components.multivalue.prototype.render = function (children) {
    if (this.component.multiple) {
        let dataValue = this.dataValue;
        if (!Array.isArray(dataValue)) {
            dataValue = dataValue ? [dataValue] : [];
        }
        if (!dataValue.length) {
            dataValue = ['']
        }
        this.dataValue = dataValue;
    }
    return multivalueRender.call(this, children);
}

Templates.current = {
    wizardNav: {
        form: (ctx) => {
            let template = `
                <div class="pt-2">
            `
            ctx.buttonOrder.forEach((button: string) => {
                if (button === 'cancel' && ctx.buttons.cancel) {
                    template += `
                    <mat-fio-icon button="true"
                        label="${ctx.t('cancel')}"
                        class="bg-secondary text-on-secondary"
                        ref="${ctx.wizardKey}-cancel"
                        aria-label="${ctx.t('cancelButtonAriaLabel')}"/>
                    </mat-fio-icon>
                    `
                }
                if (button === 'previous' && ctx.buttons.previous) {
                    template += `
                    <mat-fio-icon button="true"
                        label="${ctx.t('previous')}"
                        class="bg-primary text-on-primay"
                        ref="${ctx.wizardKey}-previous"
                        aria-label="${ctx.t('previousButtonAriaLabel')}">
                    </mat-fio-icon>
                    `
                }
                if (button === 'next' && ctx.buttons.next) {
                    template += `
                    <mat-fio-icon button="true"
                        label="${ctx.t('next')}"
                        class="bg-primary text-on-primay"
                        ref="${ctx.wizardKey}-next"
                        aria-label="${ctx.t('nextButtonAriaLabel')}">
                    </mat-fio-icon>
                    `
                }
                if (button === 'submit' && ctx.buttons.submit) {
                    if (ctx.disableWizardSubmit) {
                        template += `
                            <mat-fio-icon button="true"
                                disabled
                                label="${ctx.t('submit')}"
                                class="bg-primary text-on-primay"
                                ref="${ctx.wizardKey}-submit"
                                aria-label="${ctx.t('submit')} button. Click to submit the form">
                            </mat-fio-icon>
                        `
                    } else {
                        template += `
                            <mat-fio-icon button="true"
                                label="${ctx.t('submit')}"
                                class="bg-primary text-on-primay"
                                ref="${ctx.wizardKey}-submit"
                                aria-label="${ctx.t('submit')} button. Click to submit the form">
                            </mat-fio-icon>
                        `
                    }
                }
            })
            template += `
                </div>
            `
            return template;
        }
    },
    wizardHeader: {
        form: (ctx) => {
            let template = ``;
            template += `
                <div class="mat-horizontal-stepper-header-container" aria-label="Wizard navigation" id="${ctx.wizardKey}-header" ref="${ctx.wizardKey}-header">
            `
            ctx.panels.forEach((panel, index) => {
                template += `
                    <div role="tab"
                        class="mat-step-header mat-horizontal-stepper-header ${ctx.currentPage === index ? 'mat-primary' : ''}"
                        tabindex="0" id="cdk-step-label-0-0" aria-posinset="1" aria-setsize="3"
                        data-index="${index}" role="tab"
                        ref="${ctx.wizardKey}-link"
                        aria-controls="cdk-step-content-0-0" aria-selected="true">
                        <div class="mat-ripple mat-step-header-ripple mat-focus-indicator"></div>
                        <div class="mat-step-icon mat-step-icon-state-number ${ctx.currentPage === index ? 'mat-step-icon-selected' : ''}">
                            <div class="mat-step-icon-content">
                                <span aria-hidden="true">${index + 1}</span>
                            </div>
                        </div>
                        <div class="mat-step-label ${ctx.currentPage === index ? 'mat-step-label-selected mat-step-label-active' : ''}">
                            <div class="mat-step-text-label">${ctx.t(panel.title, {_userInput: true})}</div>
                        </div>
                    </div>
                `
                if (index < ctx.panels.length - 1) {
                    template += `
                    <div class="mat-stepper-horizontal-line"></div>
                    `
                }
            })
            template += `
                </div>
            `
            return template;
        }
    },
    wizard: {
        form: (ctx) => {
            let template = `<fio-dummy-stepper></fio-dummy-stepper>`
            template += `
                <div role="tablist"
                    class="mat-stepper-horizontal mat-stepper-label-position-end"
                    aria-orientation="horizontal">
                    <div class="mat-horizontal-stepper-wrapper">
                        ${ctx.wizardHeader}
                        <div class="mat-horizontal-content-container">
                            <div role="tabpanel"
                                ref="${ctx.wizardKey}"
                                class="mat-horizontal-stepper-content"
                                style="transform: none; visibility: inherit;">
                                ${ctx.components}
                            </div>
                             ${ctx.wizardNav}
                        </div>
                    </div>
                </div>
            `
            return template;
        }
    },
    icon: {
        form: (ctx) => {
            return `<mat-fio-icon icon="${ctx.content}" ref="${ctx.ref}" classNames="${ctx.className}"></mat-fio-icon>`
        }
    },
    multiValueTable: {
        form: (ctx) => {
            let template = `
            <fio-dummy-table></fio-dummy-table>
            <fio-dummy-card></fio-dummy-card>
            <mat-fio-label standalone="true" required="${ctx.component.validate?.required}"
                label="${ctx.component.label}"></mat-fio-label>
            <div class="mat-mdc-card mdc-card mat-mdc-card-outlined mdc-card--outlined">
                <div class="mat-mdc-card-content">
                    <table class="mat-mdc-table mdc-data-table__table cdk-table mat-elevation-z1 p-2">
                        <tbody class="mdc-data-table__content">
                            ${ctx.rows}
                        </tbody>
                    </table>
            `
            if (!ctx.disabled) {
                template += `
                    <div class="mat-mdc-card-actions mdc-card__actions">
                        <mat-fio-icon button="true" ref="addButton"
                            classNames="text-primary"
                            label="${ctx.t(ctx.addAnother, {_userInput: true})}"
                            icon="heroicons_outline:plus-circle">
                        </mat-fio-icon>
                    </div>
                `
            }
            template += `
                </div>
            </div>
            `
            return template;
        }
    },
    multiValueRow: {
        form: (ctx) => {
            let template = '';
            template += `
                <tr ref="row" class="mat-mdc-row mdc-data-table__row">
                    <td class="mat-mdc-cell mdc-data-table__cell cdk-cell label-hidden">
                        ${ctx.element}
                    </td>
            `
            if (!ctx.disabled) {
                template += `
                    <td class="mat-mdc-cell mdc-data-table__cell cdk-cell">
                        <mat-fio-icon iconButton="true" ref="removeRow"
                                 classNames="text-error"
                                 icon="heroicons_outline:trash"></mat-fio-icon>
                    </td>
                `
            }
            template += `
                </tr>
            `

            return template;
        }
    },
    field: {
        form: (ctx) => ctx.element
    },
    component: {
        form: (ctx) => {
            let template = `
            <div id="${ctx.id}" class="pt-2 ${ctx.classes}" ref="component"
             `
            if (ctx.styles) {
                template += ` styles="${ctx.styles}"`
            }
            template += '>'
            if (ctx.component.type === 'textarea' && ctx.component.editor && ctx.visible) {
                template += `
                <mat-fio-label standalone="true" required="${ctx.component.validate?.required}"label="${ctx.component.label}"></mat-fio-label>
            `
            }
            if (ctx.visible) {
                template += `${ctx.children}
                `
            }

            template += '</div>'
            return template;
        },
    },
    builderComponent: {
        form: (ctx) => {
            let template = ``;

            template += `
                <div class="builder-component" ref="dragComponent">
            `
            if (!ctx.disableBuilderActions) {
                template += `
                    <div class="component-btn-group bg-card rounded-lg shadow-md" data-noattach="true">
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Remove button. Click to remove component from the form"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="removeComponent"
                            icon="heroicons_outline:trash">
                        </mat-fio-icon>
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Copy button. Click to copy component"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="copyComponent"
                            icon="feather:copy">
                        </mat-fio-icon>
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Paste below button. Click to paste component below the current component"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="pasteComponent"
                            icon="mat_outline:save">
                        </mat-fio-icon>
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Edit json button. Click to edit json of the current component"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="editJson"
                            icon="heroicons_outline:wrench-screwdriver">
                        </mat-fio-icon>
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Move button"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="moveComponent"
                            icon="feather:move">
                        </mat-fio-icon>
                        <mat-fio-icon iconButton="true"
                            class="bg-primary text-on-primay"
                            aria-label="Edit button. Click to open component settings modal window"
                            tabindex="-1"
                            classNames="formio-action-button"
                            ref="editComponent"
                            icon="heroicons_outline:cog-8-tooth">
                        </mat-fio-icon>
                    </div>
            `
            }
            template += `
                ${ctx.html}
            </div>
        `

            return template;
        }
    },
    builderPlaceholder: {
        form: (ctx) => {
            return `
                <div
                    class="drag-and-drop-alert alert alert-info no-drag bg-secondary-container h-10 rounded-lg flex items-center justify-center"
                    style="text-align:center;"
                    role="alert"
                    data-noattach="true"
                    data-position="${ctx.position}">
                    ${ctx.t('Drag and Drop a form component')}
                </div>
            `
        }
    }
}
const CHECKBOX_OPTIONS: FormioCustomComponentInfo = {
    type: 'checkbox', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-checkbox', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Checkbox', // Title of the component
    group: 'basic', // Build Group
    icon: 'feather:check-square', // Icon
    baseType: 'checkbox',
    //template: 'field', // Optional: define a template for the element. Default: input
//  changeEvent: 'valueChange', // Optional: define the changeEvent when the formio updates the value in the state. Default: 'valueChange',
    editForm: Components.components.checkbox.editForm, // Optional: define the editForm of the field. Default: the editForm of a textfield
//  documentation: '', // Optional: define the documentation of the field
//  weight: 0, // Optional: define the weight in the builder group
//  schema: {}, // Optional: define extra default schema for the field
//  extraValidators: [], // Optional: define extra validators  for the field
    emptyValue: null, // Optional: the emptyValue of the field
    //fieldOptions: ['visible'], // Optional: explicit field options to get as `Input` from the schema (may edited by the editForm)
};

const TEXTFIELD_OPTIONS: FormioCustomComponentInfo = {
    type: 'textfield', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-textfield', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Text Field', // Title of the component
    group: 'basic', // Build Group
    icon: 'feather:terminal', // Icon
    baseType: 'textfield',
    editForm: Components.components.textfield.editForm,
};

const TEXTAREA_OPTIONS: FormioCustomComponentInfo = {
    type: 'textarea', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-textarea', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Textarea', // Title of the component
    group: 'basic', // Build Group
    icon: 'mat_outline:font_download', // Icon
    baseType: 'textarea',
    editForm: Components.components.textarea.editForm,
};

const RADIO_OPTIONS: FormioCustomComponentInfo = {
    type: 'radio', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-radio', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Radio', // Title of the component
    group: 'basic', // Build Group
    icon: 'heroicons_outline:check-circle', // Icon
    baseType: 'radio',
    editForm: Components.components.radio.editForm,
};

const TAGS_OPTIONS: FormioCustomComponentInfo = {
    type: 'tags', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-tags', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Tags', // Title of the component
    group: 'advanced', // Build Group
    icon: 'heroicons_outline:tag', // Icon
    baseType: 'tags',
    editForm: Components.components.tags.editForm,
};


const SELECT_OPTIONS: FormioCustomComponentInfo = {
    type: 'select', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-select', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Select', // Title of the component
    group: 'basic', // Build Group
    icon: 'mat_outline:format_list_bulleted', // Icon
    baseType: 'select',
    editForm: Components.components.select.editForm,
};

const SELECTBOXES_OPTIONS: FormioCustomComponentInfo = {
    type: 'selectboxes', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-selectboxes', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Select Boxes', // Title of the component
    group: 'basic', // Build Group
    icon: 'feather:plus-square', // Icon
    baseType: 'selectboxes',
    editForm: Components.components.selectboxes.editForm,
};

const TIME_OPTIONS: FormioCustomComponentInfo = {
    type: 'time', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-time', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Time', // Title of the component
    group: 'advance', // Build Group
    icon: 'heroicons_outline:clock', // Icon
    baseType: 'time',
    editForm: Components.components.time.editForm,
};

const DATETIME_OPTIONS: FormioCustomComponentInfo = {
    type: 'datetime', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-datetime', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Date/Time', // Title of the component
    group: 'advanced', // Build Group
    baseType: 'datetime',
    icon: 'heroicons_outline:calendar-days', // Icon
    editForm: Components.components.datetime.editForm,
};

const DAY_OPTIONS: FormioCustomComponentInfo = {
    type: 'day', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-day', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Day', // Title of the component
    group: 'advanced', // Build Group
    baseType: 'day',
    icon: 'heroicons_outline:calendar-days', // Icon
    editForm: Components.components.day.editForm,
};

const CURRENCY_OPTIONS: FormioCustomComponentInfo = {
    type: 'currency', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-currency', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Currency', // Title of the component
    group: 'advanced', // Build Group
    icon: 'mat_outline:attach_money', // Icon
    baseType: 'currency',
    editForm: Components.components.currency.editForm,
};

const NUMBER_OPTIONS: FormioCustomComponentInfo = {
    type: 'number', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-number', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Number', // Title of the component
    group: 'basic', // Build Group
    icon: 'heroicons_outline:hashtag', // Icon,
    baseType: 'number',
    editForm: Components.components.number.editForm,
};

const PHONE_NUMBER_OPTIONS: FormioCustomComponentInfo = {
    type: 'phoneNumber', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-phonenumber', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Phone Number', // Title of the component
    group: 'advanced', // Build Group
    icon: 'heroicons_outline:phone', // Icon
    baseType: 'phoneNumber',
    editForm: Components.components.phoneNumber.editForm,
};

const PASSWORD_OPTIONS: FormioCustomComponentInfo = {
    type: 'password', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-password', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Password', // Title of the component
    group: 'basic', // Build Group
    icon: 'heroicons_outline:eye-slash', // Icon
    baseType: 'password',
    editForm: Components.components.password.editForm,
};

const URL_OPTIONS: FormioCustomComponentInfo = {
    type: 'url', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-url', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'URL', // Title of the component
    group: 'advanced', // Build Group
    baseType: 'url',
    icon: 'heroicons_outline:link', // Icon
    editForm: Components.components.url.editForm,
};

const BUTTON_OPTIONS: FormioCustomComponentInfo = {
    type: 'button', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-button', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Button', // Title of the component
    group: 'basic', // Build Group
    icon: 'heroicons_outline:stop', // Icon
    baseType: 'button',
    editForm: Components.components.button.editForm,
};

const EMAIL_OPTIONS: FormioCustomComponentInfo = {
    type: 'email', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-email', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Email', // Title of the component
    group: 'advanced', // Build Group
    baseType: 'email',
    icon: 'heroicons_outline:at-symbol', // Icon
    editForm: Components.components.email.editForm,
};

const SURVEY_OPTIONS: FormioCustomComponentInfo = {
    type: 'survey', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-survey', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Survey', // Title of the component
    group: 'advanced', // Build Group
    icon: 'mat_outline:format_list_bulleted', // Icon
    baseType: 'survey',
    editForm: Components.components.survey.editForm,
};

const TABS_OPTIONS: FormioCustomComponentInfo = {
    type: 'tabs', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-tabs', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Tabs', // Title of the component
    group: 'layout', // Build Group
    icon: 'heroicons_outline:folder-open', // Icon
    baseType: 'tabs',
    editForm: Components.components.tabs.editForm
};

const ADDRESS_OPTIONS: FormioCustomComponentInfo = {
    type: 'address', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-address', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Address', // Title of the component
    group: 'advanced', // Build Group
    icon: 'heroicons_outline:home', // Icon
    baseType: 'address',
    editForm: Components.components.address.editForm
};

const PANEL_OPTIONS: FormioCustomComponentInfo = {
    type: 'panel', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-panel', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Panel', // Title of the component
    group: 'layout', // Build Group
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'panel',
    editForm: Components.components.panel.editForm
};

const TABLE_OPTIONS: FormioCustomComponentInfo = {
    type: 'table', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-table', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Table', // Title of the component
    group: 'advanced', // Build Group
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'table',
    editForm: Components.components.table.editForm
};

const WIZARD_OPTIONS: FormioCustomComponentInfo = {
    type: 'wizard', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-wizard', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Wizard', // Title of the component
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'wizard',
    group: 'layout', //
};

const PDF_OPTIONS: FormioCustomComponentInfo = {
    type: 'pdf', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-pdf', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'PDF', // Title of the component
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'pdf',
    group: 'layout', //
};

const PDF_BUILDER_OPTIONS: FormioCustomComponentInfo = {
    type: 'pdf-builder', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-pdf-builder', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'PDF', // Title of the component
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'pdf-builder',
    group: 'layout', //
};

const WEBFORM_BUILDER_OPTIONS: FormioCustomComponentInfo = {
    type: 'webform-builder', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-webform-builder', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Webform', // Title of the component
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'webform-builder',
    group: 'layout', //
};

const WIZARD_BUILDER_OPTIONS: FormioCustomComponentInfo = {
    type: 'wizard-builder', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-wizard-builder', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Wizard', // Title of the component
    icon: 'heroicons_outline:credit-card', // Icon
    baseType: 'wizard-builder',
    group: 'layout', //
};

const WELLS_OPTIONS: FormioCustomComponentInfo = {
    type: 'well', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-well', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Well', // Title of the component
    icon: 'heroicons_outline:bookmark-square', // Icon
    baseType: 'well',
    group: 'layout', //
    editForm: Components.components.well.editForm
};

const DATAGRID_OPTIONS: FormioCustomComponentInfo = {
    type: 'datagrid', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-datagrid', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Data Grid', // Title of the component
    icon: 'heroicons_outline:table-cells', // Icon
    baseType: 'datagrid',
    group: 'data', //
    editForm: Components.components.datagrid.editForm
};

const DATAMAP_OPTIONS: FormioCustomComponentInfo = {
    type: 'datamap', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-datamap', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Data Map', // Title of the component
    icon: 'heroicons_outline:table-cells', // Icon
    baseType: 'datamap',
    group: 'data', //
    editForm: Components.components.datagrid.editForm
};

const SIGNATURE_OPTIONS: FormioCustomComponentInfo = {
    type: 'signature', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-signature', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Signature', // Title of the component
    icon: 'heroicons_outline:table-cells', // Icon
    baseType: 'signature',
    group: 'data', //
    editForm: Components.components.signature.editForm
};

const EDITGRID_OPTIONS: FormioCustomComponentInfo = {
    type: 'editgrid', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-editgrid', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Edit Grid', // Title of the component
    icon: 'heroicons_outline:table-cells', // Icon
    baseType: 'editgrid',
    group: 'data', //
    editForm: Components.components.editgrid.editForm
};

const MULTIVALUE_OPTIONS: FormioCustomComponentInfo = {
    type: 'multivalue', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-multivalue', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Multivalue', // Title of the component
    icon: 'heroicons_outline:table-cells', // Icon
    baseType: 'multivalue',
    group: 'data', //
    editForm: Components.components.editgrid.editForm
};

const FIELDSET_OPTIONS: FormioCustomComponentInfo = {
    type: 'fieldset', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-fieldset', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'Fieldset', // Title of the component
    group: 'layout', // Build Group
    icon: 'heroicons_outline:hashtag', // Icon,
    baseType: 'fieldset',
    editForm: Components.components.fieldset.editForm,
};

const FILE_OPTIONS: FormioCustomComponentInfo = {
    type: 'file', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-file', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'File', // Title of the component
    group: 'advanced', // Build Group
    baseType: 'file',
    icon: 'mat_outline:attach_file', // Icon
    editForm: Components.components.file.editForm,
};

const HTML_OPTIONS: FormioCustomComponentInfo = {
    type: 'htmlelement', // custom type. Formio will identify the field with this type.
    selector: 'mat-fio-htmlelement', // custom selector. Angular Elements will create a custom html tag with this selector
    title: 'HTML', // Title of the component
    group: 'layout', // Build Group
    baseType: 'htmlelement',
    icon: 'mat_outline:attach_file', // Icon
    editForm: Components.components.htmlelement.editForm,
};

const LABEL_OPTIONS: FormioCustomTag = {
    selector: 'mat-fio-label'
};

const ICON_OPTIONS: FormioCustomTag = {
    selector: 'mat-fio-icon'
};

const DUMMY_TABLE_OPTIONS: FormioCustomTag = {
    selector: 'fio-dummy-table'
};

const DUMMY_STEPPER_OPTIONS: FormioCustomTag = {
    selector: 'fio-dummy-stepper'
};

const DUMMY_CARD_OPTIONS: FormioCustomTag = {
    selector: 'fio-dummy-card'
};

const DUMMY_ACCORDION_OPTIONS: FormioCustomTag = {
    selector: 'fio-dummy-accordion'
};

const registerMaterialComponents = (injector: Injector) => {
    registerCustomFormioComponent(CHECKBOX_OPTIONS, MaterialCheckboxComponent, injector);
    registerCustomFormioComponent(TEXTFIELD_OPTIONS, MaterialTextfieldComponent, injector);
    registerCustomFormioComponent(TEXTAREA_OPTIONS, MaterialTextareaComponent, injector);
    registerCustomFormioComponent(RADIO_OPTIONS, MaterialRadioComponent, injector);
    registerCustomFormioComponent(SELECT_OPTIONS, MaterialSelectComponent, injector);
    registerCustomFormioComponent(SELECTBOXES_OPTIONS, MaterialSelectBoxesComponent, injector);
    registerCustomFormioComponent(TAGS_OPTIONS, MaterialTagsComponent, injector);
    registerCustomFormioComponent(TIME_OPTIONS, MaterialTimeComponent, injector);
    registerCustomFormioComponent(DATETIME_OPTIONS, MaterialDateComponent, injector);
    registerCustomFormioComponent(CURRENCY_OPTIONS, MaterialCurrencyComponent, injector);
    registerCustomFormioComponent(NUMBER_OPTIONS, MaterialNumberComponent, injector);
    registerCustomFormioComponent(PHONE_NUMBER_OPTIONS, MaterialPhoneNumberComponent, injector);
    registerCustomFormioComponent(PASSWORD_OPTIONS, MaterialPasswordComponent, injector);
    registerCustomFormioComponent(URL_OPTIONS, MaterialUrlComponent, injector);
    registerCustomFormioComponent(BUTTON_OPTIONS, MaterialButtonComponent, injector);
    registerCustomFormioComponent(EMAIL_OPTIONS, MaterialEmailComponent, injector);
    registerCustomFormioComponent(SURVEY_OPTIONS, MaterialSurveyComponent, injector);
    registerCustomFormioComponent(ADDRESS_OPTIONS, MaterialAddressComponent, injector);
    registerCustomFormioComponent(DAY_OPTIONS, MaterialDayComponent, injector);
    registerCustomFormioComponent(PANEL_OPTIONS, MaterialPanelComponent, injector);
    registerCustomFormioComponent(TABLE_OPTIONS, MaterialTableComponent, injector);
    registerCustomFormioComponent(WELLS_OPTIONS, MaterialWellComponent, injector);
    registerCustomFormioComponent(TABS_OPTIONS, MaterialTabsComponent, injector);
    registerCustomFormioComponent(DATAGRID_OPTIONS, MaterialDataGridComponent, injector)
    registerCustomFormioComponent(DATAMAP_OPTIONS, MaterialDatamapComponent, injector)
    registerCustomFormioComponent(EDITGRID_OPTIONS, MaterialEditGridComponent, injector)
    registerCustomFormioComponent(FIELDSET_OPTIONS, MaterialFieldsetComponent, injector)
    //registerCustomFormioComponent(FILE_OPTIONS, MaterialFileComponent, injector)
    registerCustomFormioComponent(HTML_OPTIONS, MaterialHtmlComponent, injector)
    //registerCustomFormioComponent(MULTIVALUE_OPTIONS, MaterialMultiValueComponent, injector)
    //registerCustomFormioComponent(WIZARD_OPTIONS, MaterialWizardComponent, injector);
    registerCustomFormioComponent(PDF_OPTIONS, MaterialPdfComponent, injector);
    registerCustomFormioComponent(PDF_BUILDER_OPTIONS, MaterialPdfBuilderComponent, injector);
    registerCustomFormioComponent(WEBFORM_BUILDER_OPTIONS, MaterialWebBuilderComponent, injector);
    registerCustomFormioComponent(WIZARD_BUILDER_OPTIONS, MaterialWizardBuilderComponent, injector);
    registerCustomFormioComponent(SIGNATURE_OPTIONS, MaterialSignatureComponent, injector);

    registerCustomComponent(LABEL_OPTIONS, LabelComponent, injector);
    registerCustomComponent(ICON_OPTIONS, MaterialIconComponent, injector);
    registerCustomComponent(DUMMY_TABLE_OPTIONS, DummyTable, injector);
    registerCustomComponent(DUMMY_STEPPER_OPTIONS, DummyStepper, injector);
    registerCustomComponent(DUMMY_CARD_OPTIONS, DummyCard, injector);
}


@Injectable()
export class FormioService {
    constructor(private injector: Injector) {
        registerMaterialComponents(injector);
    }
}
