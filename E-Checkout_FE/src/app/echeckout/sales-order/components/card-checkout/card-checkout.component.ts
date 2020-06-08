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
  selector: 'app-card-checkout',
  templateUrl: './card-checkout.component.html',
  styleUrls: ['./card-checkout.component.scss']
})
export class CardCheckoutComponent implements OnInit {
  productList: any = [];
  allCustomerData: any;
  allProductData: any;
  completeOrderData: any;
  customerList: any = [];
  currentCustomerData: any;
  currentProductData: any;
  phoneNumber = '[6-9]\\d{9}';
  CardCheckoutForm: FormGroup;
  productForm: FormGroup;
  customerFormData: any;
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
              name:  this.allCustomerData[i].mobile + ' ( ' + this.allCustomerData[i].first_name + ' ) '
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
    this.CardCheckoutForm = this.formBuilder.group({
      // tslint:disable-next-line: max-line-length
      first_name: [!!data && !!data.first_name ? data.first_name : '', [Validators.required, Validators.maxLength(120), Validators.pattern(/^[a-zA-Z .]+$/)]],
      last_name: [!!data && !!data.last_name ? data.last_name : '', [ Validators.maxLength(120), Validators.pattern(/^[a-zA-Z .]+$/)]],
      email: [!!data && !!data.email ? data.email : '', [Validators.required, Validators.email]],
      // tslint:disable-next-line: max-line-length
      address1: [!!data && !!data.address1 ? data.address1 : '', [Validators.required, Validators.maxLength(420)]],
      address2: [!!data && !!data.address2 ? data.address2 : '', [ Validators.maxLength(420)]],
      // tslint:disable-next-line: max-line-length
      mobile: [!!data && !!data.mobile ? data.mobile : null, [Validators.required, Validators.pattern(/^((\+)?(\d{2}[-]))?(\d{10}){1}?$/)]],
      // tslint:disable-next-line: max-line-length
       country: [!!data && !!data.country ? data.country : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
       // tslint:disable-next-line: max-line-length
       state: [!!data && !!data.state ? data.state : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      city: [!!data && !!data.city ? data.city : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      zip_code: [!!data && !!data.zip_code ? data.zip_code : null, [Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      // tslint:disable-next-line: max-line-length
       s_mobile: [!!data && !!data.s_mobile ? data.s_mobile : null, [Validators.required, Validators.pattern(/^((\+)?(\d{2}[-]))?(\d{10}){1}?$/)]],
     // // tslint:disable-next-line: max-line-length
      s_email: [!!data && !!data.s_email ? data.s_email : '', [Validators.required, Validators.email]],
      s_address1: [!!data && !!data.s_address1 ? data.s_address1 : '', [Validators.required, Validators.maxLength(420)]],
      // tslint:disable-next-line: max-line-length
      s_country: [!!data && !!data.s_country ? data.s_country : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      s_state: [!!data && !!data.s_state ? data.s_state : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      s_city: [!!data && !!data.s_city ? data.s_city : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      s_zip_code: [!!data && !!data.s_zip_code ? data.s_zip_code : null, [Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      product_id: [!!data && !!data.product_id ? data.product_id : null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      // tslint:disable-next-line: max-line-length
      card_number: [!!data && !!data.card_number ? data.card_number : '', [Validators.required, Validators.pattern(/^((?:4\d{3})|(?:5[1-5]\d{2})|(?:6011)|(?:3[68]\d{2})|(?:30[012345]\d))[ -]?(\d{4})[ -]?(\d{4})[ -]?(\d{4}|3[4,7]\d{13})$/)]],
      // tslint:disable-next-line: max-line-length
      expiry_date: [!!data && !!data.expiry_date ? data.expiry_date : '', [Validators.required, Validators.pattern(/^\d{1,2}\/\d{2}$/)]],
      cvv: [!!data && !!data.cvv ? data.cvv : '', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
      comment: [!!data && !!data.comment ? data.comment : '']
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
    if (!(!!this.CardCheckoutForm.get('product_id').value || !!(this.CardCheckoutForm.get('quantity').value)) ) {
      this.toastrService.showError('Error', 'Please Select Product and Quantity First !!!');
      return false;
    }
    const Reqobj = {
      product_id : this.CardCheckoutForm.get('product_id').value,
      quantity : +(this.CardCheckoutForm.get('quantity').value),
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
    this.orderService.saveCardCheckoutData(data.value).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_order_created === true &&  response.data.is_customer_exist === true) {
            this.toastrService.showSuccess('Success', response.data.message + '( Order Id : ' + response.data.order_id + ' )');
            this.router.navigate(['/sales-orders'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          } else if (response.data.is_order_created === true &&  response.data.is_customer_exist === false) {
             if (!!response.data.order_id && response.data.order_id !== '') {
             // tslint:disable-next-line: max-line-length
             this.router.navigate(['/sales-orders/customer-verification'], { queryParams: { id : response.data.order_id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
          } else if (response.data.is_order_created === false) {
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
