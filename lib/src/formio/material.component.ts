import {
    ChangeDetectorRef,
    Component,
    effect,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    Output,
    Signal,
    viewChild
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FormioEvent } from './elements.common';
import { eventBus } from './formio.service';
import _, { get } from 'lodash';
import { FormioControl } from './FormioControl';
import { Components } from 'formiojs';

@Component({
    selector: 'material-component',
    template: ``,
    standalone: true
})
export class MaterialComponent {
    translocoService = inject(TranslocoService);
    element = inject(ElementRef);
    cdr = inject(ChangeDetectorRef)
    control: FormioControl =  new FormioControl();
    // @ts-ignore
    input: Signal<ElementRef> = viewChild('input');
    @Output()
    formioEvent: EventEmitter<FormioEvent> = new EventEmitter();
    component: any;

    instance: any;
    labelIsHidden: boolean;

    _id = ''
    @Input()
    set id(id: any) {
        this._id = id
    }

    _value: any

    @Input()
    set value(value: any) {
        this._value = value;
        if (this._value) {
            this.setValue(this._value)
        }
    }

    get value() {
        return this._value;
    }

    @Output()
    valueChange: EventEmitter<any> = new EventEmitter();

    constructor() {
        eventBus.on('setInstance', (id, instance) => {
            if (id === this._id || this._id === `${id}-${instance.component.key}`) {
                this.instanceInitialized(instance);
            }
        });

        effect(() => {
            if (this.input()) {
                // Set the input masks.
                this.instance.setInputMask(this.input().nativeElement);
                this.instance.addFocusBlurEvents(this.input().nativeElement);
            }
        });
    }

    onChange(keepInputRaw?: boolean) {
        let value = this.getValue();

        if (value === undefined || value === null) {
            value = this.instance.emptyValue;
        }

        this.instance.updateValue(value, {modified: true});
        this.instance.triggerChange();

        this.cdr.markForCheck();
    }

    validateOnInit() {
        const {key} = this.instance.component;
        const validationValue = this.getFormValue(this.instance.path);

        if (validationValue === null) {
            return;
        }

        this.instance.setPristine(false);

        // @ts-ignore
        const validationResult = Components.components.base.Validator.checkComponent(
            this.instance,
            {[key]: validationValue},
            {[key]: validationValue}
        );

        if (validationResult.length) {
            this.instance.setCustomValidity(validationResult, false);
            if (!!validationValue) {
                this.control.markAsTouched();
            }
        }
    }

    getValue() {
        if (!this.instance.hasInput || this.instance.viewOnly || !this.instance.refs.input || !this.instance.refs.input.length) {
            return this.instance.dataValue;
        }
        const values = [];
        for (const i in this.instance.refs.input) {
            if (this.instance.refs.input.hasOwnProperty(i)) {
                if (!this.component.multiple) {
                    return this.getValueAt(i);
                }
                // @ts-ignore
                values.push(this.getValueAt(i));
            }
        }
        if (values.length === 0 && !this.component.multiple) {
            return '';
        }

        return values;
    }

    getValueAt(index: any) {
        const input = this.instance.refs.input[index];
        return input ? input.value : undefined;
    }

    setValue(value: any) {
        if (Array.isArray(value) && this.component.multiple) {
            const index = this.getIndex();
            value = value[index];
        }
        if (value) {
            this.control.patchValue(value);
        }

        this.cdr.markForCheck();
    }

    storeFormData() {
        if (this.instance.parent && this.instance.parent.submission && this.instance.parent.submission.data) {
            sessionStorage.setItem('formData', JSON.stringify(this.instance.parent.submission.data));
        }
    }

    shouldValidateOnInit() {
        return this.instance;
    }

    getFormValue(path: string) {
        const formData = JSON.parse(<string>sessionStorage.getItem('formData'));

        if (!formData) {
            return null;
        }

        return get(formData, path);
    }

    isError() {
        if (this.instance.error && !this.component.hideError) {
            this.control.setErrors(this.component.validate);
            return true;
        } else {
            return false;
        }
    }

    getErrorMessage() {
        if (this.instance.error && this.instance.error.messages) {
            const {messages} = this.instance.error;

            for (const msg of messages) {
                if (msg.context && (this.control.hasError(msg.context.validator) || msg.context.validator)) {
                    return this.instance.error.message;
                }
            }
        }
    }

    instanceInitialized(instance: any) {
        this.instance = instance;
        this.control.setInstance(instance);

        this.instance.root?.on('beforeSetSubmission', ({data}) => {
            if (data) {
                this.setValue(get(data, instance.component.key))
                if (instance.component.multiple) {
                    instance.redraw()
                }
            }
        });

        this.instance.root?.on('change', () => this.cdr.markForCheck());

        this.component = instance.component;
        this.component.labelIsHidden = instance.labelIsHidden();
        const defaultValue = this.component?.defaultValue;
        const instanceValue = _.get(this.instance.data, this.component.key);
        if(instanceValue) {
            if (!this.component.multiple || Array.isArray(instanceValue)) {
                this.setValue(instanceValue);
            } else {
                this.setValue([instanceValue]);
            }
        }
        else if (defaultValue) {
            if (!this.component.multiple || Array.isArray(defaultValue)) {
                this.setValue(defaultValue);
            } else {
                this.setValue([defaultValue]);
            }
        }

        if (this.isReadOnly) {
            this.control.disable();
        }
        try {
            const _this = this;
            Object.defineProperty(this.element.nativeElement, 'value', {
                    get: () => {
                        return _this.control?.value
                    },
                    set(value: any) {
                        if (value) {
                            _this.setValue(value)
                        }
                    },
                    enumerable: true
                }
            )
        } catch (e) {
        }

        if (this.shouldValidateOnInit()) {
            this.storeFormData();
            this.validateOnInit();
        }
    }

    getIndex() {
        if (!this.component.multiple) {
            return 0;
        }
        const tbody =  this.element.nativeElement.closest('tbody');
        const tr =  this.element.nativeElement.closest('tr');
        if (tbody && tr) {
            const children = Array.from(tbody.children);
            return children.indexOf(tr);
        }
        return -1;
    }

    get isReadOnly() {
        return this.instance.options.readOnly || this.instance.disabled || this.instance.shouldDisabled ||
            this.component?.disabled || this.component.readOnly
    }
}
