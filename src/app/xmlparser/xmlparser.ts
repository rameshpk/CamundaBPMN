import {
  FormField,
  FormFieldConstraint,
  FormFieldOption,
  VariableFieldType
} from "../schemas";

// XML form field type value in lower case, but variable type is capitalise.
// Mapping of lower case field type to capitalise variable type.
const TYPE_MAPPING = Object.values(VariableFieldType).reduce(
  (mapping, type) => {
    mapping[type.toLowerCase()] = type;
    return mapping;
  },
  {}
);

export enum FieldProperty {
  /* Delegate custom fields mapping to this property key. */
  Type = "type",
  ShowOnFooter = "showOnFooter"
}

/**
 * Specific parser for Camunda XML,
 * to retrieve information from BPMN definition.
 */
export class CamundaXMLParser {
  private xmlDoc: XMLDocument;

  constructor(xmlString: string) {
    this.xmlDoc = this.parse(xmlString);
  }

  private parse(xmlString: string): XMLDocument {
    try {
      let xmlDoc;

      if (DOMParser) {
        xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
      } else {
        // @ts-ignore
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        // @ts-ignore
        xmlDoc.async = false;
        // @ts-ignore
        xmlDoc.loadXML(xmlString);
      }
      return xmlDoc;
    } catch (e) {
      console.error(`CamundaXMLParser: ${e}`);
    }
  }

  /**
   * Retrieve user task form fields by task id.
   */
  public getUserTaskForm(id: string): FormField[] {
    try {
      const element = this.query(this.xmlDoc, `userTask#${id}`);
      return this.getFormFields(element);
    } catch (e) {
      console.log(`CamundaXMLParser: ${e}`);
      return [];
    }
  }

  private getFormFields(formElement: Element): FormField[] {
    const elements = this.queryAll(formElement, "formField");
    const fields = [];

    elements.forEach((element) => {
      const [
        key,
        defaultType,
        label,
        defaultValue
      ] = this.getAttributes(element, ["id", "type", "label", "defaultValue"]);
      const properties = this.getFormFieldProperties(element);
      const type = this.parseType(
        defaultType,
        this.getFormFieldProperties(element)
      );
      const value = this.parseValue(defaultValue, type);

      const validation = this.getFormFieldConstraints(
        element
      ).map((constraints) => constraints.toValidator());
      if (
        type === VariableFieldType.Enum ||
        (type as string) === "radiobutton"
      ) {
        const options = this.getFormFieldValues(element);
        fields.push({
          key,
          type,
          label,
          value,
          options,
          validation,
          properties
        });
      } else {
        fields.push({ key, type, label, value, validation, properties });
      }
    });

    return fields;
  }

  private getFormFieldValues(fieldElement: Element): FormFieldOption[] {
    const elements = this.queryAll(fieldElement, "value");
    const values = [];

    elements.forEach((element) => {
      const [key, value] = this.getAttributes(element, ["id", "name"]);
      values.push({ key, value });
    });

    return values;
  }

  private getFormFieldConstraints(
    fieldElement: Element
  ): FormFieldConstraint[] {
    const validation = this.query(fieldElement, "validation");
    if (!validation) return [];
    const constraints: NodeListOf<Element> = this.queryAll(
      validation,
      "constraint"
    );
    const values = [];

    constraints.forEach((element: Element) => {
      const [name, config] = this.getAttributes(element, ["name", "config"]);
      values.push(new FormFieldConstraint(name, config));
    });

    return values;
  }

  private getFormFieldProperties(fieldElement: Element): object {
    const element = this.query(fieldElement, "properties");
    return element ? this.getFormFieldProperty(element) : {};
  }

  private getFormFieldProperty(propertiesElement: Element): object {
    const elements = this.queryAll(propertiesElement, "property");
    const values = {};

    elements.forEach((element) => {
      const [key, value] = this.getAttributes(element, ["id", "value"]);
      values[key] = value;
    });

    return values;
  }

  private cleanSelector(selector: string): string {
    const character = ":";
    return selector.replace(new RegExp(character, "g"), `\\${character}`);
  }

  private query(element: XMLDocument | Element, selector: string): Element {
    return element.querySelector(this.cleanSelector(selector));
  }

  private queryAll(
    element: XMLDocument | Element,
    selector: string
  ): NodeListOf<Element> {
    return element.querySelectorAll(this.cleanSelector(selector));
  }

  private getAttributes(element: Element, keys: string[]): any[] {
    return keys.map((key) => element.getAttribute(key));
  }

  private parseType(type: string, properties: object): VariableFieldType {
    if (properties.hasOwnProperty(FieldProperty.Type)) {
      return properties[FieldProperty.Type] || TYPE_MAPPING[type];
    }

    return TYPE_MAPPING[type];
  }

  private parseValue(value: any, type: VariableFieldType): any {
    switch (type) {
      case VariableFieldType.Boolean:
        return Boolean(value);
      case VariableFieldType.Long:
        return Number(value);
      default:
        return value;
    }
  }
}
