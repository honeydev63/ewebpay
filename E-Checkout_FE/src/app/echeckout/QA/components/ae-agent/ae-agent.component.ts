import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { Router, ActivatedRoute } from '@angular/router';
import { QAService } from '../../services/qa.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-ae-agent',
  templateUrl: './ae-agent.component.html',
  styleUrls: ['./ae-agent.component.scss']
})
export class AeQaAgentComponent implements OnInit {
  agentDetailsForm: FormGroup;
  checkAgentFormValidation = false;
  form: any;
  sub: any;
  UserFormType: string;
  UserId: number;
  Userobj: any = {};
  productDetailsObj: any = {};
  constructor(private formBuilder: FormBuilder,
              private qaservice: QAService ,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: EpharmaToasterService) {
                this.sub = this.route
                .queryParams
                .subscribe(params => {
                  this.UserFormType = params.type;
                  if ( this.UserFormType !== 'add') {
                    this.UserId = params.id;
                    this.getAgentData(this.UserId);
                  } else {
                    this.bindAddForm();
                  }
                });
               }

  ngOnInit() {
  }
// Method: to bind items for adding data to list in product's list
bindAddForm() {
  this.agentDetailsForm = this.formBuilder.group({
    agent_id: [''],
    agent_name: ['', [Validators.required, Validators.maxLength(100)]],
    mobile: ['', [Validators.required, Validators.min(0), Validators.pattern(/^[0-9.]+$/)]],
    email: ['', [Validators.required, Validators.email]]
  });
}
// End of above code
bindEditForm(data: any) {
  this.agentDetailsForm = this.formBuilder.group({
    agent_id: [{ value: !!data.agent_id ? data.agent_id : '', disabled: true}],
    // tslint:disable-next-line: max-line-length
    agent_name: [!!data.agent_name ? data.agent_name : '', [Validators.required, Validators.maxLength(100)]],
    // tslint:disable-next-line: max-line-length
    mobile: [!!data.mobile ? +(data.mobile ) : '', [Validators.required, Validators.min(0), Validators.pattern(/^[0-9.]+$/)]],
    email: [!!data.email ? data.email : '', [Validators.required, Validators.email]]
  });
}
getAgentData(aId) {
  const queryObj = {
    agent_id: aId
  };
  console.log(queryObj);
  const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
  this.qaservice.getAgentDataById(productQueryStr).subscribe(
    response => {
      if ( !!response && !!response.data && response.data.is_user_exist === true) {
        this.bindEditForm(response.data.user);
        } else {
          this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
          this.router.navigate(['/qa']);
        }
    },
    err => console.error(err)
  );
}
// Method: sending Agent details to BE
saveAgentDetails(data: any) {
if ( data.valid === true) {
  this.checkAgentFormValidation = false;
  if (this.UserFormType === 'edit') {
    data.value.agent_id = this.UserId;
    this.qaservice.editQaAgentData(data.value).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_qa_agent_updated === true ) {
            this.toastrService.showSuccess('Success', response.data.message);
            this.router.navigate(['/qa']);
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
        }
      },
      err => console.error(err)
    );
  } else {
    this.qaservice.saveAgentData(data.value).subscribe(
      response => {
        if (!!response && !!response.data ) {
          if (response.data.is_qa_agent_added === true ) {
            this.toastrService.showSuccess('Success', response.data.message);
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/qa']);
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
        }
      },
      err => console.error(err)
    );
  }
} else {
  this.checkAgentFormValidation = true;
  this.toastrService.showError('Error', 'Provided data is not in correct format');
}
}
}
