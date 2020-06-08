import { Component, OnInit, ViewChild } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { of } from 'rxjs';
import { DatatableComponent } from '@swimlane/ngx-datatable';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import * as moment from 'moment';
import { ExportFile } from 'src/app/core/utilities/export';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportPdfFile } from 'src/app/core/utilities/export-pdf';
import { UserRole } from 'src/app/core/dictionary/user-role';
import { RoleService } from 'src/app/core/services/role.service';

@Component({
  selector: 'app-customer-listing',
  templateUrl: './customer-listing.component.html',
  styleUrls: ['./customer-listing.component.scss']
})
export class CustomerListingComponent implements OnInit {
  userRole = UserRole;
  localUserRole: number;
  exportFileEntity = new ExportFile(this.auth, this.toastrService);
  enableSummary = true;
  summaryPosition = 'top';
  pages: any;
  rows: any;
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
  constructor(private customerService: CustomerService ,
              private fb: FormBuilder,
              private router: Router,
              private formBuilder: FormBuilder,
              private toastrService: EpharmaToasterService,
              private route: ActivatedRoute,
              private auth: AuthService,
              private roleService: RoleService
              ) {
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
// Method: calling params for url
  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.filterObj.search = params.search || '';
      this.filterObj.currentPage = params.currentPage || '';
      this.filterObj.perPage = params.perPage || '';
      this.getCustomerListData();
    });
  }
   // End of above code
  // Method:to set limit for pagination in  customer's list
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
   // End of above code
  // Method:to fetch items from BE for customer's list
  getCustomerListData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.customerService.getCustomerList(tempUrlQuery).subscribe(
      response => {
        if (!!response && !!response.data) {
          this.rows = response.data;
          this.pages = response.meta;
          this.pages.currentPage = response.meta.currentPage - 1;
        } else {
          this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
        }
      },
      err => console.error(err)
      // display error
    );
  }
  // End of above code
  // Method: to view customer details
  viewCustomer(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/customers/view-customer'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
   // End of above code
  // Method: to edit customer details
    editCustomer(data) {
      if (!!data.id && data.id !== '') {
        // tslint:disable-next-line: max-line-length
        this.router.navigate(['/customers/edit-customer'], { queryParams: {id: data.id}, queryParamsHandling: 'merge' });
      } else {
        this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
   }
  // End of above code
    // Method: used to export the data
    exportFile() {
      this.exportFileEntity.getExportData('customers', '');
    }
    // End of the above code
    // Method: When user tries to delete customer from the customer's list
    deleteCustomer(data) {
      const isConfirmDelete = confirm('Do you seriously want to delete ' + data.first_name + ' ( Customer ID: ' + data.id + ' ) ?');
      if (isConfirmDelete === true) {
      const queryObj = {
        customer_id: data.id
      };
      const customerQueryStr = EpharmaUtilities.generateQueryString(queryObj);
      this.customerService.deleteCustomer(customerQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_customer_deleted === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getCustomerListData();
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
    // End of the above code
  // Method: is used to Navigate user to a desired filter Page
  navigateUser() {
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    const tempLink = '/customers?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.offset + 1;
    this.navigateUser();
  }
  // End of the above code
}
// End of code
