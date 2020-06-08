import { Component, OnInit, ViewChild } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { SalesOrdersService } from '../../services/sales-order.service';
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
  selector: 'app-sales-order-listing',
  templateUrl: './sales-order-listing.component.html',
  styleUrls: ['./sales-order-listing.component.scss']
})
export class SalesOrderListingComponent implements OnInit {
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
  constructor(private saleService: SalesOrdersService ,
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
// Method: calling method for fetching items  from BE
  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.filterObj.search = params.search || '';
      this.filterObj.currentPage = params.currentPage || '';
      this.filterObj.perPage = params.perPage || '';
      this.getSalesListData();
    });
  }
   // End of above code
   changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
   // End of above code
  // Method:to fetch items from BE for order's list
  getSalesListData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.saleService.getSalesOrderList(tempUrlQuery).subscribe(
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
  // Method: to view order details
  viewOrder(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/sales-orders/view-order'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
   // End of the above code
  // Method: is used to Navigate user to a desired filter Page
  navigateUser() {
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    const tempLink = '/sales-orders?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.offset + 1;
    this.navigateUser();
  }
  // End of above code
  // Method: used to export the data
  exportFile() {
    this.exportFileEntity.getExportData('sales-order', '');
  }
  // End of the above code
}
