import { Component, OnInit, ViewChild } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MerchantService } from '../../services/merchant.service';
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
  selector: 'app-merchant-listing',
  templateUrl: './merchant-listing.component.html',
  styleUrls: ['./merchant-listing.component.scss']
})
export class MerchantListingComponent implements OnInit {
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
  constructor(private merchantService: MerchantService ,
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
      this.getMerchantListData();
    });
  }
   // End of above code
  // Method:to set limit for pagination in  merchant's list
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
   // End of above code
  // Method:to fetch items from BE for merchant's list
  getMerchantListData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.merchantService.getMerchantList(tempUrlQuery).subscribe(
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
  // Method: to view merchant details
  viewMerchant(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/merchants/view-merchant'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
   // End of above code
  // Method: to edit merchant details
    editMerchant(data) {
      if (!!data.id && data.id !== '') {
        // tslint:disable-next-line: max-line-length
        this.router.navigate(['/merchants/edit-merchant'], { queryParams: {id: data.id}, queryParamsHandling: 'merge' });
      } else {
        this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
   }
  // End of above code
    // Method: used to export the data
    exportFile() {
      this.exportFileEntity.getExportData('merchants', '');
    }
    // End of the above code
    // Method: When user tries to delete merchant from the merchant's list
    deleteMerchant(data) {
      const isConfirmDelete = confirm('Do you seriously want to delete ' + data.first_name + ' ( Merchant ID: ' + data.id + ' ) ?');
      if (isConfirmDelete === true) {
      const queryObj = {
        merchant_id: data.id
      };
      const merchantQueryStr = EpharmaUtilities.generateQueryString(queryObj);
      this.merchantService.deleteMerchant(merchantQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_merchant_deleted === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getMerchantListData();
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
    const tempLink = '/merchants?' + tempUrlQuery;
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
