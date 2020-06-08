import { Component, OnInit, ViewChild } from '@angular/core';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SalesOrdersService } from '../../services/sales-order.service';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { IDatePickerConfig } from 'ng2-date-picker';
import { of, Subscribable, Subscription } from 'rxjs';
import * as moment from 'moment';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { DataTableColumnHeaderDirective } from '@swimlane/ngx-datatable';
import { CodeNode } from 'source-list-map';
import { SalesOrderDataService } from '../../services/sales-order.data.service';

@Component({
  selector: 'app-bank-checkout',
  templateUrl: './bank-checkout.component.html',
  styleUrls: ['./bank-checkout.component.scss']
})
export class BankCheckoutComponent implements OnInit {
  paymentList: any;
  checkOrderFormValidation = false;
  phoneNumber = '[6-9]\\d{9}';
  staticObj = {
    customerSelect: null
  };
  allCustomerData: any;
  customerList: any = [];
  currentCustomerData: any;
  BankCheckoutForm: FormGroup;
  newCustomerTag: Subscription;
  customerFormData: any;
  constructor(
    private salesOrderDataService: SalesOrderDataService,
    private formBuilder: FormBuilder,
    private orderService: SalesOrdersService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService
  ) {
    this.newCustomerTag = salesOrderDataService.newCustomerTagSource$.subscribe(
      data => {
        console.log('The Constructor Data is ', data);
    });
  }
  ngOnInit() {
    this.getCustomerDropdown();
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
  // End of the above code
  // Method which is used when user select a customer
  onCustormerSelect(selected) {
    if (selected.id === null) {
      if (selected.name.match(this.phoneNumber)) {
        this.bindBankCheckoutForm({ mobile: selected.name});
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
      this.bindBankCheckoutForm(this.currentCustomerData);
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
  bindBankCheckoutForm(data: any) {
    this.BankCheckoutForm = this.formBuilder.group({
      // tslint:disable-next-line: max-line-length
      first_name: [!!data && !!data.first_name ? data.first_name : '', [ Validators.maxLength(120), Validators.pattern(/^[a-zA-Z .]+$/)]],
      last_name: [!!data && !!data.last_name ? data.last_name : '', [ Validators.maxLength(120), Validators.pattern(/^[a-zA-Z .]+$/)]],
      company_name: [!!data && !!data.company_name ? data.company_name : '', [Validators.maxLength(120)]],
      // tslint:disable-next-line: max-line-length
      customer_name: [!!data && !!data.customer_name ? data.customer_name : '', [Validators.required, Validators.maxLength(120)]],
      // tslint:disable-next-line: max-line-length
      mobile: [!!data && !!data.mobile ? data.mobile : '', [Validators.required, Validators.pattern('[6-9]\\d{9}')]],
      email: [!!data && !!data.email ? data.email : '', [Validators.required, Validators.email]],
      // tslint:disable-next-line: max-line-length
      address1: [!!data && !!data.address1 ? data.address1 : '', [Validators.required, Validators.maxLength(420)]],
      address2: [!!data && !!data.address2 ? data.address2 : '', Validators.maxLength(120)],
      // tslint:disable-next-line: max-line-length
      country: [!!data && !!data.country ? data.country : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      state: [!!data && !!data.state ? data.state : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      city: [!!data && !!data.city ? data.city : '', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      zip_code: [!!data && !!data.zip_code ? data.zip_code : '', [Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      type: [!!data && !!data.type ? data.type : '', Validators.required],
      bank_name: [!!data && !!data.bank_name ? data.bank_name : '', [Validators.required, Validators.maxLength(120)]],
      // tslint:disable-next-line: max-line-length
      account_number: [!!data && !!data.account_number ? data.account_number : '', [Validators.required, Validators.pattern(/[!^\w\s]$/)]],
      // tslint:disable-next-line: max-line-length
      routing_number: [!!data && !!data.routing_number ? data.routing_number : '', [Validators. required, Validators.maxLength(9), Validators.pattern(/[!^\w\s]$/)]],
      amount: [!!data && !!data.amount ? data.amount : '', [Validators.required, Validators.min(1), Validators.pattern(/^[0-9.]+$/)]],
      description: [!!data && !!data.description ? data.description : '']
    });
  }
  // End Of Above Code
  // Method: Which is used to save details
  saveDetails(data: any) {
    console.log('The Data is ', data);
    if (data.valid === true) {
      this.checkOrderFormValidation = false;
      data.value.amount = +(data.value.amount);
      data.value.mobile = +(data.value.mobile);
      data.value.account_number_bank = +(data.value.account_number_bank);
      data.value.routing_number_bank = +(data.value.routing_number_bank);
      this.orderService.saveBankCheckoutData(data.value).subscribe(
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
  // End of the above Code
}
