import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { SalesOrdersService } from '../../services/sales-order.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-suspicious-order-listing',
  templateUrl: './suspicious-order-listing.component.html',
  styleUrls: ['./suspicious-order-listing.component.scss']
})
export class SuspiciousOrderListingComponent implements OnInit {
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
  status = [
    {id: 'resolved', name: 'Resoved'},
    {id: 'not_resolved', name: 'Not Resolved'},
  ];
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
  LIMITS = [
    { name: '10', id: 10 },
    { name: '25', id: 25 },
    { name: '50', id: 50 },
    { name: '100', id: 100 }
  ];
  limit: number = this.filterObj.perPage;
  rowLimits: Array<any> = this.LIMITS;
  constructor(private salesService: SalesOrdersService ,
              private fb: FormBuilder,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private toastrService: EpharmaToasterService,
              private router: Router) {
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
      this.getSuspiciousOrderListingData();
      this.changeStatusForm();
    });
  }
     // Method: formgroup for modal
     changeStatusForm() {
      this.detailsStatusForm = this.formBuilder.group({
        status : [null, Validators.required],
        reason: ['']
      });
    }
  // End of above code
  // End of above code
  // Method: to set limits for pagination
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
  // Method:to fetch items from BE for QA's list
  getSuspiciousOrderListingData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.salesService.getSuspiciousOrderListingData(tempUrlQuery).subscribe(
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
  // Method: Used to Navigate user to the view Component when user click on the View Order
  viewOrder(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/sales-orders/view-suspicious-order'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
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
      const req = {
        order_status : this.detailsStatusForm.get('status').value,
        order_id : this.selectedWorkOrder.id,
        reason: this.detailsStatusForm.get('reason').value
      };
      this.salesService.changeStatus(req).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_status_updated === true) {
              this.toastrService.showSuccess('Success', response.message);
              this.closeChangeStatusModal.nativeElement.click();
              this.getSuspiciousOrderListingData();
            } else {
              this.toastrService.showError('Error', response.message);
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
    const tempLink = 'qa/suspicious-listing?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.offset + 1;
    this.navigateUser();
}
}
