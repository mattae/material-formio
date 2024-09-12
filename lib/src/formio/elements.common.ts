import { ExtendedComponentSchema } from '@formio/angular';
import { EventEmitter } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { BuilderInfo, ValidateOptions } from 'formiojs';

// Custom Angular Components
export interface FormioCustomComponentInfo extends BuilderInfo {
    type: string;
    selector: string;
    emptyValue?: any;
    extraValidators?: (keyof ValidateOptions)[];
    fieldOptions?: string[];
    template?: string;
    changeEvent?: string // Default: valueChange
    editForm?: () => { components: ExtendedComponentSchema[] };
    baseType?: string;
}

export interface FormioCustomTag {
    selector: string
}

export type FormioCustomElement = NgElement & WithProperties<{ value: any } & ExtendedComponentSchema>;

export interface FormioEvent {
    eventName: string;
    data?: {
        [key: string]: any;
    };
}

export interface FormioCustomComponent<T> {
    value: T; // Should be an @Input
    valueChange: EventEmitter<T>; // Should be an @Output
    disabled: boolean;
    formioEvent?: EventEmitter<FormioEvent>; // Should be an @Output
}
