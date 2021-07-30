// Camunda default supported form field.
export enum VariableFieldType {
  String = "String",
  Long = "Long",
  Date = "Date",
  Boolean = "Boolean",
  Enum = "Enum"
}

// tslint:disable-next-line: interface-over-type-literal
export type VariableValue = {
  [key: string]: { [key: string]: any };
};

// tslint:disable-next-line: interface-over-type-literal
export type Variable = { [key: string]: VariableField };

export interface VariableField {
  type: VariableFieldType;
  value: any;
  valueInfo: any; // TODO: verify with camunda
}
