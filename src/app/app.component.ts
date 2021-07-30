import { Component, OnInit, ViewChild } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { TaskService } from "./service";
import { CamundaXMLParser } from "./xmlparser/xmlparser";
import { Validators } from "@angular/forms";
import { FieldConfig } from "./field.interface";
import { DynamicFormComponent } from "./components/dynamic-form/dynamic-form.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  @ViewChild(DynamicFormComponent, { static: true }) form: DynamicFormComponent;

  type_to_config = {
    String: {
      type: "input",
      label: "Username",
      inputType: "text",
      name: "name",
      validations: [
        {
          name: "pattern",
          validator: Validators.pattern("^[a-zA-Z]+$"),
          message: "Accept only text"
        }
      ]
    },
    email: {
      type: "input",
      label: "Email Address",
      inputType: "email",
      name: "email",
      validations: [
        {
          name: "pattern",
          validator: Validators.pattern(
            "^[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$"
          ),
          message: "Invalid email"
        }
      ]
    },
    password: {
      type: "input",
      label: "Password",
      inputType: "password",
      name: "password",
      validations: []
    },
    radiobutton: {
      type: "radiobutton",
      label: "Gender",
      name: "gender",
      options: ["Male", "Female"],
      value: "Male"
    },
    Date: {
      type: "date",
      label: "DOB",
      name: "dob",
      validations: []
    },
    Enum: {
      type: "select",
      label: "Country",
      name: "country",
      value: "UK",
      options: ["India", "UAE", "UK", "US"]
    },
    Boolean: {
      type: "checkbox",
      label: "Accept Terms",
      name: "term",
      value: true
    },
    button: {
      type: "button",
      label: "Save"
    }
  };
  regConfig: FieldConfig[] = [];
  constructor(protected service: TaskService) {}
  ngOnInit(): void {
    this.getFormFields({
      processDefinitionId: "process",
      taskDefinitionKey: "UserSignUpTask"
    }).subscribe((res) => {
      let temp = [];
      console.log(res);
      res.formFields.forEach((element) => {
        let config = this.type_to_config[element.type];
        let validations = element.validation.map((v) => ({
          name: "",
          validator: v,
          message: ""
        }));
        config.validations && config.validations.concat(validations);
        temp.push({
          ...config,
          value: element.value || config.value,
          options: element.options || config.options
        });
      });
      this.regConfig = temp;
      console.log(temp);
    });
  }

  private getFormFields(task): Observable<any> {
    return this.service.getProcessDefinitionXML(task.processDefinitionId).pipe(
      map((xml) => {
        const parser = new CamundaXMLParser(xml.bpmn20Xml);
        return {
          ...task,
          formFields: parser.getUserTaskForm(task.taskDefinitionKey)
        };
      })
    );
  }
  submit(value: any) {}
}
