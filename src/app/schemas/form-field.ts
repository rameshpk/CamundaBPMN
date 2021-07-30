import { Validators } from "@angular/forms";
import { VariableField, VariableFieldType } from "./variable";

export const FormFieldType = {
  ...VariableFieldType
};
export type FormFieldType = VariableFieldType;
// Decalre more types here

export interface FormFieldOption {
  key: any;
  value: any;
}

export const FormFieldValidators = {
  required: Validators.required
};
export class FormFieldConstraint {
  name: string;
  config: any;

  constructor(name: string, config: any) {
    this.name = name;
    this.config = config;
  }
  toValidator() {
    // TODO take in config for other validators
    return this.name && FormFieldValidators[this.name];
  }
}
export type Modify<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R;

export type FormField = Modify<
  VariableField,
  {
    key: string;
    type: FormFieldType;
    label: string;
    options?: FormFieldOption[];
    validation?: any;
    properties: object;
  }
>;
