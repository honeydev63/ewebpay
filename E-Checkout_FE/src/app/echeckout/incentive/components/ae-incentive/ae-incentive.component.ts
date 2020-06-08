import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IncentiveService } from '../../services/incentive.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { DraggableDirective } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-ae-incentive',
  templateUrl: './ae-incentive.component.html',
  styleUrls: ['./ae-incentive.component.scss']
})
export class AeIncentiveComponent implements OnInit {
  incentiveDetailsForm: FormGroup;
  checkAgentFormValidation = false;
  form: any;
  sub: any;
  UserFormType: string;
  UserId: number;
  Userobj: any = {};
  productDetailsObj: any = {};
  incentiveModelType = [
    {id: 'Monthly', name: 'Monthly'},
    {id: 'Quarterly', name: 'Quarterly'}
  ];
  constructor(private formBuilder: FormBuilder,
              private incentiveService: IncentiveService ,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: EpharmaToasterService) {
                this.sub = this.route
                .queryParams
                .subscribe(params => {
                  this.UserFormType = params.type;
                  if ( this.UserFormType !== 'add') {
                    this.UserId = params.id;
                    this.getIncentiveData(this.UserId);
                  } else {
                    this.bindAddForm();
                  }
                });
               }

  ngOnInit() {
  }
  // Method: to bind items for adding data to list in product's list
  bindAddForm() {
    this.incentiveDetailsForm = this.formBuilder.group({
      incentive_id: [''],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: [null, [Validators.required]],
      target_amount: ['', [Validators.required]]
    });
  }
  // End of above code
  bindEditForm(data: any) {
    this.incentiveDetailsForm = this.formBuilder.group({
      incentive_id: [{ value: !!data.incentive_id ? data.incentive_id : '', disabled: true}],
      // tslint:disable-next-line: max-line-length
      name: [!!data.name ? data.name : '', [Validators.required, Validators.maxLength(100)]],
      // tslint:disable-next-line: max-line-length
      type: [!!data.type ? (data.type ) : '', [Validators.required]],
      target_amount: [!!data.target_amount ? data.target_amount : '', [Validators.required]]
    });
  }
  getIncentiveData(aId) {
    const queryObj = {
      incentive_id: aId
    };
    const incentiveQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.incentiveService.getIncentiveDataById(incentiveQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_incentive_exist === true) {
          this.bindEditForm(response.data.incentive);
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/incentives'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          }
      },
      err => console.error(err)
    );
  }
// Method: sending Agent details to BE
saveIncentiveDetails(data: any) {
  if ( data.valid === true) {
    this.checkAgentFormValidation = false;
    if (this.UserFormType === 'edit') {
      data.value.incentive_id = this.UserId;
      this.incentiveService.editIncentiveData(data.value).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_incentive_updated === true ) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.router.navigate(['/incentives'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
      this.incentiveService.saveIncentiveData(data.value).subscribe(
        response => {
          if (!!response && !!response.data ) {
            if (response.data.is_incentive_created === true ) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.router.navigate(['/incentives'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
