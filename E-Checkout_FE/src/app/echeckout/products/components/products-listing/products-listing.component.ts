import { Component, OnInit } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportFile } from 'src/app/core/utilities/export';
import { UserRole } from 'src/app/core/dictionary/user-role';
import { RoleService } from 'src/app/core/services/role.service';

@Component({
  selector: 'app-products-listing',
  templateUrl: './products-listing.component.html',
  styleUrls: ['./products-listing.component.scss']
})
export class ProductsListingComponent implements OnInit {
  userRole = UserRole;
  localUserRole: number;
  exportFileEntity = new ExportFile(this.auth, this.toastrService);
  pages: any;
  rows: any;
  ColumnMode = ColumnMode;
  importProductForm: FormGroup;
  columns = [
    { name: 'Product ID', prop: 'id' },
    { name: 'Product Name', prop: 'stock_keeping_unit' },
    { name: 'Type of Product', prop: 'name'},
    { name: 'Price', prop: 'brand' },
    { name: 'Actions', prop: 'product_name'}
  ];
  sub: any;
  searchField: FormControl;
  searchForm: FormGroup;
  filterObj = {
    search: '',
    currentPage: 1,
    perPage: 50
  };
  LIMITS = [
    { name: '10', id: 10 },
    { name: '25', id: 25 },
    { name: '50', id: 50 },
    { name: '100', id: 100 }
  ];

  limit: number = this.filterObj.perPage;
  rowLimits: Array<any> = this.LIMITS;
  constructor(
    private productsService: ProductsService ,
    private router: Router,
    private auth: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
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
        this.getProductListingData();
      });
  }
  // End of above code
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
  // Method: is used to Navigate user to a desired filter Page
  navigateUser() {
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    const tempLink = '/products?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method:to fetch items from BE for inventory's list
  getProductListingData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.productsService.getProductData(tempUrlQuery).subscribe(
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
  // Method: Used to navigate user to the Edit Component when user click on the Edit Inventory
  editProduct(data) {
    if (!!data.product_id && data.product_id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/products/product'], { queryParams: { type: 'edit', id: data.product_id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
  // End of the above code
  // Method: Used to Navigate user to the view Component when user click on the View Inventory
  viewProduct(data) {
    if (!!data.product_id && data.product_id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/products/view'], { queryParams: { id: data.product_id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
  // End of the Above code
  // Method: When user tries to delete product from the Product listing of the Inventory
  deleteProduct(data) {
    const isConfirmDelete = confirm('Do you seriously want to delete ' + data.product_name + ' ( Product ID: ' + data.product_id + ' ) ?');
    if (isConfirmDelete === true) {
      const queryObj = {
        product_id: data.product_id
      };
      const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
      this.productsService.deleteProduct(productQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_product_deleted === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getProductListingData();
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
  // Method: used to export the data
  exportFile() {
    this.exportFileEntity.getExportData('product', '');
  }
  // End of the above code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.page;
    this.navigateUser();
  }
  // End of the Above code
}
