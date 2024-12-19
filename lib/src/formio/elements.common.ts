import { ExtendedComponentSchema } from '@formio/angular';
import { EventEmitter } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';

export interface ValidateOptions {
    /**
     * If this component is required.
     */
    required?: boolean;

    /**
     * For text input, this checks the minimum length of text for valid input
     */
    minLength?: number;

    /**
     * For text input, this checks the maximum length of text for valid input
     */
    maxLength?: number;

    /**
     * For text input, this checks the text agains a Regular expression pattern.
     */
    pattern?: string;

    /**
     * A custom javascript based validation or a JSON object for using JSON Logic
     */
    custom?: any;

    /**
     * If the custom validation should remain private (only the backend will see it and execute it).
     */
    customPrivate?: boolean;

    /**
     * Minimum value for numbers
     */
    min?: number;

    /**
     * Maximum value for numbers
     */
    max?: number;

    minSelectedCount?: number;
    maxSelectedCount?: number;
    minWords?: number;
    maxWords?: number;
    email?: boolean;
    url?: boolean;
    date?: boolean;
    day?: boolean;
    json?: string;
    mask?: boolean;
    minDate?: any;
    maxDate?: any;
}

export interface BuilderInfo {
    title: string;
    group: string;
    icon: string;
    documentation?: string;
    weight?: number;
    schema?: ExtendedComponentSchema;
}

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
