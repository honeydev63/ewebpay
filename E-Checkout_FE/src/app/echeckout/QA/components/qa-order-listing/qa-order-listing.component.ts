import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl , FormGroup, FormBuilder, Validators} from '@angular/forms';
import { QAService } from '../../services/qa.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { UserRole } from 'src/app/core/dictionary/user-role';
import { RoleService } from 'src/app/core/services/role.service';

@Component({
  selector: 'app-qa-order-listing',
  templateUrl: './qa-order-listing.component.html',
  styleUrls: ['./qa-order-listing.component.scss']
})
export class QaOrderListingComponent implements OnInit {
  userRole = UserRole;
  localUserRole: number;
  @ViewChild('closeChangeStatusModal', null) closeChangeStatusModal: ElementRef;
  display = 'none';
  responseCode = ResponseCode;
  SelectionType = SelectionType;
  enableSummary = true;
  checkStatusFormValidation = false;
  detailsStatusForm: FormGroup;
  summaryPosition = 'top';
  pages: any;
  rows: any;
  selected = [];
  selectedWorkOrder: any;
  ColumnMode = ColumnMode;
  sub: any;
  searchField: FormControl;
  searchForm: FormGroup;
  filterObj = {
    search: '',
    perPage: 50,
    currentPage: 1,
  };
  status = [
    {id: 'not_verified', name: 'Not Verified'},
    {id: 'verified', name: 'Verified'},
    {id: 'fraud', name: 'Fraud'},
    {id: 'suspicious', name: 'Suspicious'},
    {id: 'other', name: 'Other'}
  ];
  LIMITS = [
    { name: '10', id: 10 },
    { name: '25', id: 25 },
    { name: '50', id: 50 },
    { name: '100', id: 100 }
  ];
  limit: number = this.filterObj.perPage;
  rowLimits: Array<any> = this.LIMITS;
  constructor(private qaService: QAService ,
              private fb: FormBuilder,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private toastrService: EpharmaToasterService,
              private router: Router,
              private roleService: RoleService) {
                this.localUserRole = this.roleService.getUserRole();
                this.searchField = new FormControl();
                this.searchForm = fb.group({search: this.searchField});
                this.searchField.valueChanges
                  .debounceTime(400)
                  .switchMap(term => of(term)).subscribe(result => {
                    this.filterObj.search = result;
                    this.navigateUser();
                  });
               }

  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.filterObj.search = params.search || '';
      this.filterObj.currentPage = params.currentPage || '';
      this.filterObj.perPage = params.perPage || '';
      this.getQaOrderListingData();
      this.changeStatusForm();
    });
  }
  changeStatusForm() {
    this.detailsStatusForm = this.formBuilder.group({
      status : [null, Validators.required],
      reason: ['']
    });
  }
// End of above code
// Method: to set limits for pagination
changeRowLimits(event) {
  this.filterObj.perPage = event.id;
  this.filterObj.currentPage = 1;
  this.navigateUser();
}
// Method:to fetch items from BE for Qa's list
getQaOrderListingData() {
  this.router.events.subscribe((evt) => {
    if (!(evt instanceof NavigationEnd)) {
        return;
    }
    window.scrollTo(0, 0);
  });
  const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
  this.qaService.getQaOrderListingData(tempUrlQuery).subscribe(
    response => {
      if (!!response && !!response.data && response.data.length !== 0) {
        this.rows = response.data;
        this.pages = response.meta;
      } else {
        this.rows = [];
        this.pages = {};
      }
    },
    err => console.error(err)
    // display error
  );
}
// End of above code
// Method: Used to Navigate user to the view Component when user click on the View Agent
viewOrder(data) {
  if (!!data.id && data.id !== '') {
    // tslint:disable-next-line: max-line-length
    this.router.navigate(['/qa/view-order'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
  } else {
    this.toastrService.showError('Error', 'Something went wrong please try again later');
  }
}
  // End of above code
  openChangeStatus(data: any) {
    this.selectedWorkOrder = data;
  }
   // Method: to change status for order from Order's list
changeStatus(data: any) {
  if (data.valid === true) {
    this.checkStatusFormValidation = false;
    // tslint:disable-next-line: max-line-length
    if ( this.detailsStatusForm.get('status').value === 'fraud' || this.detailsStatusForm.get('status').value === 'suspicious' || this.detailsStatusForm.get('status').value === 'other') {
      // tslint:disable-next-line: no-unused-expression
      // tslint:disable-next-line: max-line-length
      if ( this.detailsStatusForm.get('reason').value === undefined || this.detailsStatusForm.get('reason').value == null || this.detailsStatusForm.get('reason').value === '' ) {
        this.toastrService.showError('Error', 'Please fill reason');
        return false;
      }
     }
    const req = {
      order_status : this.detailsStatusForm.get('status').value,
      reason: this.detailsStatusForm.get('reason').value,
      order_id : this.selectedWorkOrder.id
    };
    this.qaService.changeStatus(req).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_status_updated === true) {
            this.toastrService.showSuccess('Success', response.data.message);
            this.closeChangeStatusModal.nativeElement.click();
            this.getQaOrderListingData();
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
            this.toastrService.showError('Error', 'Something went wrong. Please try again later !!!');
        }
      },
      err => console.error(err)
    );
  } else {
    this.checkStatusFormValidation = true;
    this.toastrService.showError('Error', 'Please fill the form completely !!!');
  }
  // tslint:disable-next-line: max-line-length
}
// End of the above code
// Method: is used to Navigate user to a desired filter Page
navigateUser() {
  const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
  const tempLink = 'qa/orders-listing?' + tempUrlQuery;
  this.router.navigateByUrl(tempLink);
}
// End of the Above Code
// Method : to set pagination for list items
setPage(event) {
  this.filterObj.currentPage = event.offset + 1;
  this.navigateUser();
}
}
