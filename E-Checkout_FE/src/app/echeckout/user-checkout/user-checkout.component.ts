import { Component, OnInit, ViewChild, HostListener, ElementRef } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { UserCheckoutService } from './services/user-checkout.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { HttpClient} from '@angular/common/http';
import { Location } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';

@Component({
  selector: 'app-user-checkout',
  templateUrl: './user-checkout.component.html',
  styleUrls: ['./user-checkout.component.scss']
})
export class UserCheckoutComponent implements OnInit {
  addressTemplate = true;
  paymentTemplate = false;
  thankyouTemplate = false;
  usercheckoutForm: FormGroup;
  UserFormType: string;
  uId: string;
  submitted = false;
  isChecked = false;
  orderDetails: any;
  sub: any;
  ipAddress: any;
  lat: any;
  lng: any;
  userAgentString: any;
  browser: any;
  isFormDisable = false;
  isIEOrEdge = /Chrome|Firefox|Safari|msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
  searchForm: FormGroup;
  searchField: FormControl;
  searchResults: any;
  searchcontent: any;
  showsearchDropdown = false;
  cur_tab = 0;
  cur_payment_method = 0;
  values = '';
  persionInfoSubmitted = false;
  prdouctDetailSubmitted = false;
  cardPaymentSubmitted = false;
  constructor(private usercheckoutservice: UserCheckoutService ,
              private fb: FormBuilder,
              private http: HttpClient,
              private router: Router,
              private formBuilder: FormBuilder,
              private toastrService: EpharmaToasterService,
              private route: ActivatedRoute,
              private auth: AuthService) {
                if (navigator) {
                navigator.geolocation.getCurrentPosition( pos => {
                    this.lng = +pos.coords.longitude;
                    this.lat = +pos.coords.latitude;
                  });
                }
                this.searchField = new FormControl();
                this.searchForm = fb.group({search: this.searchField});
                this.searchField.valueChanges
                .debounceTime(300).
                switchMap(term => of(term)).subscribe(result => {
                if (!!result) {
                  this.searchResults = ['Loading'];
                  if (/^ *$/.test(result)) {
                    this.searchResults = [{message: 'No Results Found'}];
                  } else {
                    this.searchcontent = result;
                    this.getglobalsearchData(result);
                  }
                } else {
                this.searchResults = [];
                // console.log('No Data');
                }
                });
              }
@HostListener('document:click', ['$event']) onDocumentClick(event) {
  this.showsearchDropdown = false;
  this.searchForm.reset();
}
ngOnInit() {
this.sub = this.route
.queryParams
.subscribe(params => {
  this.UserFormType = params.type;
  this.uId = params.upid;
  this.getUserDetails(this.uId);
});
this.getIPAddress();
this.getBrowserName();
}
getUserDetails(cId) {
  const queryObj = {
    upid : cId
  };
  const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
  this.usercheckoutservice.getUserDetails(productQueryStr).subscribe(
    response => {
      if ( !!response && !! response.data && response.data.is_order_exist === true) {
        this.orderDetails = response.data;
        this.binduserInfoForm(response.data);
        console.log(this.orderDetails);
      } else {
        this.orderDetails = response.data;
        console.log(this.orderDetails);
        this.toastrService.showError('Error', response.data.message);
      }
    },
    err => console.error(err)
  );
}
// End of above code
getIPAddress() {
  this.http.get('http://api.ipify.org/?format=json').subscribe((res: any) => {
    this.ipAddress = res.ip;
  });
  console.log(this.ipAddress);
}
getBrowserName() {
  this.userAgentString = window.navigator.userAgent;
  if (this.userAgentString.indexOf('MSIE') > -1 || this.userAgentString.indexOf('rv:') > -1) {
    this.browser = 'Microsoft Internet Explorer';
  }
  if (this.userAgentString.indexOf('Firefox') > -1) {
    this.browser = 'Firefox';
  }
  if (this.userAgentString.indexOf('Safari') > -1) {
    this.browser = 'Safari';
  }
  if (this.userAgentString.indexOf('OP') > -1) {
    this.browser = 'Opera';
  }
  if (this.userAgentString.indexOf('Chrome') > -1) {
    this.browser = 'Chrome';
  }
  console.log(this.browser);
  console.log(this.isIEOrEdge);
  console.log(window.navigator.appName);
  console.log(window.navigator.userAgent);
}

binduserInfoForm(data) {
this.usercheckoutForm = this.formBuilder.group({
  personInfoForm: this.formBuilder.group({
    firstname: ['', [Validators.required, Validators.maxLength(100)]],
    lastname: ['', [Validators.required, Validators.maxLength(100)]],
    emailaddress: ['', [Validators.required, Validators.email]],
    phonenumber: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
    altphonenumber: ['', [Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
    address1: ['', [Validators.required, Validators.maxLength(100)]],
    country: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    // state: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    city: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    zip_code: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
    s_address1: ['', [ Validators.required, Validators.maxLength(100)]],
    s_country: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    // s_state: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    s_city: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
    s_zip_code: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
  }),

  productDetailForm: this.formBuilder.group({
    product_name: [data.detail.product_name],
    product_id: [data.detail.product_id],
    product_qty: [data.detail.quantity],
    price: [data.detail.unit_price],
    total_amount: [data.detail.total_price],
  }),

  cardPaymentForm: this.formBuilder.group({
    card_card_no: [''],
    card_name_on_card: [''],
  })
  // upid: [data.detail.up_id, [Validators.required, Validators.maxLength(100)]],
  
  // tslint:disable-next-line: max-line-length
  // card_number: [''],
  // card_owner_name: [''],
  // expiry_date: [''],
  // cvv: [''],
  // type: ['', [ Validators.required, Validators.maxLength(20)]],
  // account_number: [''],
  // routing_number: [''],
  // bank_name: [''],
  // company_name: [''],
  // // Non Mandatory
  // comment: ['', [ Validators.maxLength(300)]],
});



// this.usercheckoutForm.get('is_card_payment').valueChanges
// // tslint:disable-next-line: variable-name
// .subscribe(is_card_payment => {
//   if (is_card_payment === true) {
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('card_owner_name').setValidators([Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]);
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('card_number').setValidators([Validators.required, Validators.pattern(/^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$/)]);
//     this.usercheckoutForm.get('expiry_date').setValidators([Validators.required, Validators.pattern(/^\d{1,2}\/\d{2}$/)]);
//     this.usercheckoutForm.get('cvv').setValidators([Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]);
//     // Test
//     this.usercheckoutForm.get('company_name').setValidators(null);
//     this.usercheckoutForm.get('account_number').setValidators(null);
//     this.usercheckoutForm.get('routing_number').setValidators(null);
//     this.usercheckoutForm.get('bank_name').setValidators(null);
//   }
//   if (is_card_payment === false) {
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('company_name').setValidators([Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]);
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('account_number').setValidators([Validators.required, Validators.pattern(/^([0-9]{11})|([0-9]{2}-[0-9]{3}-[0-9]{6})$/)]);
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('routing_number').setValidators([Validators.required, Validators.maxLength(9), Validators.pattern(/^((0[0-9])|(1[0-2])|(2[1-9])|(3[0-2])|(6[1-9])|(7[0-2])|80)([0-9]{7})$/)]);
//     // tslint:disable-next-line: max-line-length
//     this.usercheckoutForm.get('bank_name').setValidators([Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z ]+$/)]);
//     // Test
//     this.usercheckoutForm.get('card_owner_name').setValidators(null);
//     this.usercheckoutForm.get('card_number').setValidators(null);
//     this.usercheckoutForm.get('expiry_date').setValidators(null);
//     this.usercheckoutForm.get('cvv').setValidators(null);
//   }
//   this.usercheckoutForm.get('card_owner_name').updateValueAndValidity();
//   this.usercheckoutForm.get('card_number').updateValueAndValidity();
//   this.usercheckoutForm.get('expiry_date').updateValueAndValidity();
//   this.usercheckoutForm.get('cvv').updateValueAndValidity();
//   this.usercheckoutForm.get('company_name').updateValueAndValidity();
//   this.usercheckoutForm.get('account_number').updateValueAndValidity();
//   this.usercheckoutForm.get('routing_number').updateValueAndValidity();
//   this.usercheckoutForm.get('bank_name').updateValueAndValidity();
// });
}
checkValue(e) {
  if (e.target.checked) {
    this.isFormDisable = true;
    this.personInfo.s_address1.setValue(this.personInfo.address1.value);
    // this.personInfo.s_address2.setValue(this.personInfo.address2.value);
    this.personInfo.s_country.setValue(this.personInfo.country.value);
    // this.personInfo.s_state.setValue(this.personInfo.state.value);
    this.personInfo.s_city.setValue(this.personInfo.city.value);
    this.personInfo.s_zip_code.setValue(this.personInfo.zip_code.value);
  } else {
    this.isFormDisable = false;
    // this.usercheckoutForm.controls.s_address1.setValue('');
    // this.usercheckoutForm.controls.s_address2.setValue('');
    // this.usercheckoutForm.controls.s_country.setValue('');
    // this.usercheckoutForm.controls.s_city.setValue('');
    // this.usercheckoutForm.controls.s_state.setValue('');
    // this.usercheckoutForm.controls.s_zip_code.setValue('');
  }
}
get usercheckout() {
  return this.usercheckoutForm.controls;
}

get personInfo() {
  return this.usercheckoutForm.controls.personInfoForm['controls'];
}

get productDetail(){
  return this.usercheckoutForm.controls.productDetailForm['controls'];
}

get cardPayment(){
  return this.usercheckoutForm.controls.cardPaymentForm['controls'];
}
  gotoPayment() {
    this.cur_tab = 2;
    // this.submitted = true;
    // if (this.usercheckoutForm.controls.address1.valid
    //   && this.usercheckoutForm.controls.city.valid
    //   && this.usercheckoutForm.controls.state.valid
    //   && this.usercheckoutForm.controls.country.valid
    //   && this.usercheckoutForm.controls.zip_code.valid
    //   && this.usercheckoutForm.controls.s_address1.valid
    //   && this.usercheckoutForm.controls.s_city.valid
    //   && this.usercheckoutForm.controls.s_state.valid
    //   && this.usercheckoutForm.controls.s_country.valid
    //   && this.usercheckoutForm.controls.s_zip_code.valid) {
    //   this.submitted = false;
    //   this.addressTemplate = false;
    //   this.paymentTemplate = true;
    // }
  }
  saveUserDetails(data: any) {
    this.submitted = true;
    if (this.usercheckoutForm.invalid) {
        return;
    }
    if (this.usercheckoutForm.valid) {
      if ( data.valid === true) {
        const requestObj: any = {
          upid: !!this.orderDetails.detail.up_id ? this.orderDetails.detail.up_id : null,
          firstname: !!data.value.personInfoForm.firstname ? data.value.personInfoForm.firstname : null,
          lastname: !!data.value.personInfoForm.lastname ? data.value.personInfoForm.lastname : null,
          email: !!data.value.personInfoForm.emailaddress ? data.value.personInfoForm.emailaddress : null,
          phonenumber: !!data.value.personInfoForm.phonenumber ? data.value.personInfoForm.phonenumber : null,
          altphonenumber: !!data.value.personInfoForm.altphonenumber ? data.value.personInfoForm.altphonenumber : null,
          address1: !!data.value.personInfoForm.address1 ? data.value.personInfoForm.address1 : null,
          address2: null,
          country: !!data.value.personInfoForm.country ? data.value.personInfoForm.country : null,
          state: null,
          city: !!data.value.personInfoForm.city ? data.value.personInfoForm.city : null,
          zip_code: !!data.value.personInfoForm.zip_code ? +data.value.personInfoForm.zip_code : null,
          s_address1: !!data.value.personInfoForm.s_address1 ? data.value.personInfoForm.s_address1 : null,
          s_address2: null,
          s_country: !!data.value.personInfoForm.s_country ? data.value.personInfoForm.s_country : null,
          s_state: null,
          s_city: !!data.value.personInfoForm.s_city ? data.value.personInfoForm.s_city : null,
          s_zip_code: !!data.value.personInfoForm.s_zip_code ? +data.value.personInfoForm.s_zip_code : null,
          type: 'Individual',
          comment: null,
          longitude: !!this.lng ? this.lng : null,
          latitude: !!this.lat ? this.lat : null,
          ip_address: !!this.ipAddress ? this.ipAddress : null,
          browser: !!this.browser ? this.browser : null,
        };
        requestObj.is_card_payment = true;
        requestObj.is_bank_payment = false;
        requestObj.card_owner_name = null;
        requestObj.card_number = null;
        requestObj.expiry_date = null;
        requestObj.cvv = null;
        // if (data.value.is_card_payment === true) {
        //   requestObj.is_card_payment = true;
        //   requestObj.is_bank_payment = false;
        //   requestObj.card_owner_name = !!data.value.card_owner_name ? data.value.card_owner_name : null;
        //   requestObj.card_number = !!data.value.card_number ? +data.value.card_number : null;
        //   requestObj.expiry_date = !!data.value.expiry_date ? data.value.expiry_date : null;
        //   requestObj.cvv = !!data.value.cvv ? +data.value.cvv : null;
        // } else {
        //   requestObj.is_card_payment = false;
        //   requestObj.is_bank_payment = true;
        //   requestObj.account_number = !!data.value.account_number ? +data.value.account_number : null;
        //   requestObj.routing_number = !!data.value.routing_number ? +data.value.routing_number : null;
        //   requestObj.bank_name = !!data.value.bank_name ? data.value.bank_name : null;
        //   requestObj.company_name = !!data.value.company_name ? data.value.company_name : null;
        // }
        this.usercheckoutservice.saveUserCheckoutData(requestObj).subscribe(
          response => {
            if (!!response && !!response.data) {
              if (response.data.is_order_processed === true ) {
                this.paymentTemplate = false;
                this.thankyouTemplate = true;
                this.toastrService.showSuccess('Success', response.data.message);
              } else {
                this.toastrService.showError('Error', response.data.message);
              }
            } else {
              this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
            }
          },
          err => {
            console.error(err);
            this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
          }
        );
      }
    }
  }
  
  gobacktoaddress() {
    this.paymentTemplate = false;
    this.addressTemplate = true;
  }
  onKey(value: string) {
    this.values += value + ' | ';
    if (!!value) {
      this.showsearchDropdown = true;
    }
    if (value === '') {
      this.showsearchDropdown = false;
    }
  }
  // Method: Get the Offer Data from BE
  getglobalsearchData(result) {
    this.usercheckoutservice.globalsearch(result).subscribe(
      res => {
        if (!!res && !!res.data) {
          this.searchResults = res.data;
        } else {
          this.searchResults = null;
        }
      },
      err => {
        console.error(err);
        if (err.status === 500 || err.status === 502) {
          this.searchResults = ['Network Error'];
          this.toastrService.showError('Network Error', 'Please try again later.');
        } else if ( err.status === 400) {
          this.searchResults = [];
        }
      }
    );
  }
  // End
  captureSearch(data) {
    console.log(data);
    const tempAddress = data.place_details;
    if (tempAddress.length > 0) {
    let address1 = '';
    let address2 = '';
    let city = '';
    let state = '';
    let country = '';
    let pinCode = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < tempAddress.length; i++) {
      if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'administrative_area_level_2') {
        address2 = tempAddress[i].long_name;
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'locality') {
        city = tempAddress[i].long_name;
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'postal_code') {
        pinCode = +(tempAddress[i].long_name);
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'country') {
        country = tempAddress[i].long_name;
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'administrative_area_level_1') {
        state = tempAddress[i].long_name;
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'floor') {
        if (address1 === '') {
          address1 = tempAddress[i].long_name;
        } else {
          address1 = address1 + ' , ' + tempAddress[i].long_name;
        }
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'street_number') {
        if (address1 === '') {
        address1 = tempAddress[i].long_name;
        } else {
        address1 = address1 + ' , ' + tempAddress[i].long_name;
        }
      } else if (!!tempAddress[i].types[0] && tempAddress[i].types[0] === 'route') {
        if (address1 === '') {
        address1 = tempAddress[i].long_name;
        } else {
        address1 = address1 + ' , ' + tempAddress[i].long_name;
        }
      } else {
      }
    }
    // tslint:disable-next-line: max-line-length
    const tempAddress1 = !!data && !!data.structured_formatting && !!data.structured_formatting.main_text && data.structured_formatting.main_text !== '' ? data.structured_formatting.main_text : '';
    this.usercheckoutForm.controls.address1.setValue(tempAddress1);
    this.usercheckoutForm.controls.address2.setValue(address2);
    this.usercheckoutForm.controls.country.setValue(country);
    this.usercheckoutForm.controls.state.setValue(state);
    this.usercheckoutForm.controls.city.setValue(city);
    this.usercheckoutForm.controls.zip_code.setValue(pinCode);
    } else {
    this.toastrService.showError('Fetch', 'No Data to Map');
    }
  }

  gotoProduct() {
    this.persionInfoSubmitted = true;
    console.log(this.usercheckoutForm.controls.personInfoForm);
    console.log(this.usercheckoutForm.controls.personInfoForm.valid);
    if(this.usercheckoutForm.controls.personInfoForm.valid == true){
      this.cur_tab = 1;
    }
  }

  goToTab(evt, tabID){
    if(this.cur_tab == 0){
      this.persionInfoSubmitted = true;
      if(this.usercheckoutForm.controls.personInfoForm['valid'] == true){
        this.cur_tab = tabID;
      }
    }else if(this.cur_tab == 1){
      this.prdouctDetailSubmitted = true;
      if(this.usercheckoutForm.controls.productDetailForm['valid'] == true){
        this.cur_tab = tabID;
      }
    }else{
      this.cur_tab = tabID;
    }
    
  }

  goToPaymentMethod(evt, tabID) {
    this.cur_payment_method = tabID;
  }
}
