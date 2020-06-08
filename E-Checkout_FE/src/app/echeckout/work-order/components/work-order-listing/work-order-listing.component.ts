import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { WorkOrderService } from '../../services/work-order.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-work-order-listing',
  templateUrl: './work-order-listing.component.html',
  styleUrls: ['./work-order-listing.component.scss']
})
export class WorkOrderListingComponent implements OnInit {
  enableSummary = true;
  @ViewChild('closeChangeStatusModal', null) closeChangeStatusModal: ElementRef;
  summaryPosition = 'top';
  LIMITS = [
    { name: '10', id: 10 },
    { name: '25', id: 25 },
    { name: '50', id: 50 },
    { name: '100', id: 100 }
  ];
  filterObj = {
    currentPage: 1,
    perPage: 50
  };
  limit: number = this.filterObj.perPage;
  rowLimits: Array<any> = this.LIMITS;
  pages: any;
  rows: any;
  selectedStatus: any = {};
  detailsStatusForm: FormGroup;
  checkStatusFormValidation = false;
  ColumnMode = ColumnMode;
  status = [
    {id: 'signed', name: 'Signed'},
    {id: 'doc_sent', name: 'Doc Sent'},
    {id: 're_sent', name: 'Re-Sent'},
    {id: 'not_required', name: 'Not Required'},
    {id: 'other', name: 'Other'}
  ];
  sub: any;
  selectedWorkOrder: any;
  constructor(private workorderservice: WorkOrderService ,
              private fb: FormBuilder,
              private router: Router,
              private formBuilder: FormBuilder,
              private toastrService: EpharmaToasterService,
              private route: ActivatedRoute,
              private auth: AuthService) { }

  ngOnInit() {
    this.sub = this.route
      .queryParams
      .subscribe(params => {
        this.filterObj.currentPage = params.currentPage || '';
        this.filterObj.perPage = params.perPage || '';
        this.getOrderListData();
        this.changeStatusForm();
      });
  }
 // End of above code
 changeRowLimits(event) {
  this.filterObj.perPage = event.id;
  this.filterObj.currentPage = 1;
  this.navigateUser();
}
  // Method:to fetch items from BE for order's list
  getOrderListData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.workorderservice.getWorkOrderList(tempUrlQuery).subscribe(
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
  changeStatusForm() {
    this.detailsStatusForm = this.formBuilder.group({
      status : [null, Validators.required],
    });
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
        status : this.detailsStatusForm.get('status').value,
        order_id : this.selectedWorkOrder.id
      };
      this.workorderservice.changeStatus(req).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_updated === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.closeChangeStatusModal.nativeElement.click();
              this.getOrderListData();
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
     // End of above code
   // Method: to resend Order from Order's list
  resendOrder(data) {
      // tslint:disable-next-line: max-line-length
      const isConfirmDelete = confirm('Do you really want to Resend  ( Order ID: ' + data.id + ' ) ?');
      if (isConfirmDelete === true) {
      const req = {
        order_id : data.id,
        status : 2
      };
      this.workorderservice.Resend(req).subscribe(
        response => {
          if (!!response && response.data.is_sent === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getOrderListData();
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
        },
        err => console.error(err)
      );
    }
  }
  // End of the above code
  // Method: is used to Navigate user to a desired filter Page
  navigateUser() {
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    const tempLink = '/work-order?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.page;
    this.navigateUser();
  }
  // End of the Above code
  deleteWorkOrder(data: any) {
    const isConfirmDelete = confirm('Do you seriously want to delete ( Work Order ID: ' + data.id + ' ) ?');
    if (isConfirmDelete === true) {
      const queryObj = {
        order_id: data.id,
        status: 'not_required'
      };
      this.workorderservice.deleteWorkOrder(queryObj).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_updated === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getOrderListData();
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
          } else {
            this.toastrService.showError('Error', 'Something Went Wrong, Please Try Again Later !!!');
          }
        },
        err => console.error(err)
      );
    }
  }

  resendDocusign(data: any) {
    const isConfirmDelete = confirm('Do you really want to Resend Docusign?');
      if (isConfirmDelete === true) {
      const req = {
        order_id : data.id
      };
      this.workorderservice.ResendDocusign(req).subscribe(
        response => {
          if (!!response && response.data.is_sent === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getOrderListData();
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
        },
        err => console.error(err)
      );
    }
  }
}
