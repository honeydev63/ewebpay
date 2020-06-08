import { Component, OnInit, ViewChild } from '@angular/core';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SalesOrdersService } from '../../services/sales-order.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { IDatePickerConfig } from 'ng2-date-picker';
import { of } from 'rxjs';
import * as moment from 'moment';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { DataTableColumnHeaderDirective } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-link-checkout',
  templateUrl: './link-checkout.component.html',
  styleUrls: ['./link-checkout.component.scss']
})
export class LinkCheckoutComponent implements OnInit {
  productList: any = [];
  allCustomerData: any;
  allProductData: any;
  completeOrderData: any;
  customerList: any = [];
  currentCustomerData: any;
  currentProductData: any;
  phoneNumber = '[6-9]\\d{9}';
  LinkCheckoutForm: FormGroup;
  productForm: FormGroup;
  customerFormData: any;
  linkcheckoutMethod = true;
  staticObj = {
    customerSelect: null,
    productSelect: null
  };
  checkOrderFormValidation = false;
  constructor(
    private formBuilder: FormBuilder,
    private orderService: SalesOrdersService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService
  ) {
  }
  ngOnInit() {
    this.getCustomerDropdown();
    this.getProductDropdown();
    if (this.route.snapshot.routeConfig.path == 'card-checkout'){
      this.linkcheckoutMethod = false;
    }else{
      this.linkcheckoutMethod = true;
    }
  }
  // Method: used to get the dropdown data for customer
  getCustomerDropdown() {
    this.orderService.getCustomer().subscribe(
      response => {
        if (!!response && !!response.data && response.data.customer.length !== 0) {
          this.allCustomerData = response.data.customer;
          // tslint:disable-next-line: prefer-for-of
          for (let i = 0; i < this.allCustomerData.length; i++) {
            this.customerList.push({
              id: this.allCustomerData[i].id,
              name:  this.allCustomerData[i].first_name + ' ( ' + this.allCustomerData[i].id + ' ) '
            });
          }
        } else {
          this.customerList = [];
        }
      },
      err => console.error(err)
    );
  }
  onCustormerSelect(selected) {
    if (selected.id === null) {
      if (selected.name.match(this.phoneNumber)) {
        this.bindCardCheckoutForm({ mobile: selected.name});
      } else {
        this.toastrService.showError('Validation Error', 'Enter Mobile Number !!!');
        return false;
      }
    } else {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.allCustomerData.length; i++) {
       if (+(selected.id) === this.allCustomerData[i].id) {
         this.currentCustomerData = this.allCustomerData[i];
         window.scrollTo(0, 1000);
         setTimeout(() => {
           window.scrollTo(0, 1000);
      }, 1000);
         break;
       }
      }
      console.log('The Selected Customer is ', this.currentCustomerData);
      this.bindCardCheckoutForm(this.currentCustomerData);
    }
  }
   // End of the above code
   addTagFn(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
          resolve({ id: null, name: data });
      }, 0);
  });
  }
   // Method: which is used to bind the Customer form
   bindCardCheckoutForm(data: any) {
    this.LinkCheckoutForm = this.formBuilder.group({
      product_id: [!!data && !!data.product_id ? data.product_id : null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]]
    });
  }
  // End of the above code
getProductDropdown() {
  this.orderService.getProductDropdown().subscribe(
    response => {
      if (!!response && !!response.data && response.data.product.length !== 0 ) {
        // tslint:disable-next-line: prefer-for-of
        this.allProductData = response.data.product;
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.allProductData.length; i++) {
          this.productList.push({
            id: this.allProductData[i].product_id,
            name:  this.allProductData[i].product_name,
          });
        }
      } else {
        this.productList = [];
      }
    },
    err => console.error(err)
  );
//  tslint:disable-next-line: adjacent-overload-signatures
  }
  updateQuantity(data: any) {
    // tslint:disable-next-line: prefer-for-of
    if (!(!!this.LinkCheckoutForm.get('product_id').value || !!(this.LinkCheckoutForm.get('quantity').value)) ) {
      this.toastrService.showError('Error', 'Please Select Product and Quantity First !!!');
      return false;
    }
    const Reqobj = {
      product_id : this.LinkCheckoutForm.get('product_id').value,
      quantity : +(this.LinkCheckoutForm.get('quantity').value),
      };
    if ( !!Reqobj.product_id && !!Reqobj.quantity) {
    this.orderService.saveProductData(Reqobj).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_product_exist === true ) {
            this.completeOrderData = response.data;
            this.toastrService.showSuccess('Success', response.data.message);
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
  this.toastrService.showError('Error', 'Please provide product and quantity');
  }
 }
saveDetails(data: any) {
  console.log('The Data is ', data);
  if (data.valid === true) {
    this.checkOrderFormValidation = false;
    data.value.customer_id = this.currentCustomerData.id;
    const requestObj = {
      customer_id : this.currentCustomerData.id,
      product_id : !!data.value.product_id ? +(data.value.product_id) : null,
      quantity: !!data.value.quantity ? +(data.value.quantity) : null
    };
    this.orderService.saveLinkCheckoutData(requestObj).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_order_created === true) {
            this.toastrService.showSuccess('Success', response.data.message + '( Order Id : ' + response.data.id + ' )');
            if(this.linkcheckoutMethod == true){
              this.router.navigate(['/sales-orders'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
            }else{
              const url = this.router.serializeUrl(this.router.createUrlTree(['/user-checkout'], { queryParams: { 'upid': response.data.id } }));
              console.log(url);
              window.open('#'+url, '_blank');
            }
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
        }
      },
      err => {
        console.error(err);
        this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
      }
    );
  } else {
    this.checkOrderFormValidation = true;
    this.toastrService.showError('Validation Error', 'Please check your form before submitting !!!');
  }
}
}
