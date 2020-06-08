import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportPdfFile } from 'src/app/core/utilities/export-pdf';

@Component({
  selector: 'app-edit-merchant',
  templateUrl: './edit-merchant.component.html',
  styleUrls: ['./edit-merchant.component.scss']
})
export class EditMerchantComponent implements OnInit {
  productDetailsForm: FormGroup;
  checkProductFormValidation = false;
  responseCode = ResponseCode;
  form: any;
  sub: any;
  UserFormType: string;
  UserId: number;
  fileData: File = null;
  Userobj: any = {};
  tempSelectForm: FormGroup;
  productDetailsObj: any = {};
  imageName: any;
  submitted = false;
  constructor(
    private formBuilder: FormBuilder,
    private merchantService: MerchantService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService
  ) {
   }
  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.UserFormType = params.type;
      if ( this.UserFormType !== 'add') {
        this.UserId = params.id;
        this.getMerchantData(this.UserId);
      } else {
        this.bindAddForm();
      }
    });
  }
    // End of above code
  // Method: to fetch data for item in lisitng for editing details
  getMerchantData(pId) {
    const queryObj = {
      merchant_id : pId
    };
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.merchantService.getMerchantDataByID(productQueryStr).subscribe(
      response => {
          if ( !!response.data && !! response.data && response.data.is_merchant_exist === true) {
            this.bindEditCopyForm(response.data);
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/merchants/']);
          }
      },
      err => console.error(err)
    );
  }
  get merchantForm() {
    return this.productDetailsForm.controls;
  }
   // End of above code
  // Method:to add item  merchant's list
   bindAddForm() {
    this.productDetailsForm = this.formBuilder.group({
      // Madatory Always
      mobile: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
      email: ['', [Validators.required, Validators.email]],
      address1: ['', [Validators.required, Validators.maxLength(300)]],
      address2: ['', [Validators.maxLength(200)]],
      country: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      state: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      city: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      zip_code: ['', [ Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      // Mandatory If card payment is true
      is_card_payment: ['', [Validators.required]],
      // Mandatory If card payment is true
      first_name: ['', [Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      // Non Mandatory
      last_name: ['', [ Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      s_address1: ['', [ Validators.maxLength(420)]],
      s_address2: ['', [ Validators.maxLength(420)]],
      s_country: ['', [ Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_state: ['', [Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_city: ['', [Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_zip_code: ['', [Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      // tslint:disable-next-line: max-line-length
      card_number: ['', [Validators.pattern(/^((?:4\d{3})|(?:5[1-5]\d{2})|(?:6011)|(?:3[68]\d{2})|(?:30[012345]\d))[ -]?(\d{4})[ -]?(\d{4})[ -]?(\d{4}|3[4,7]\d{13})$/)]],
      expiry_date: ['', [Validators.pattern(/^\d{1,2}\/\d{2}$/)]],
      cvv: ['', [ Validators.pattern(/^[0-9]{3,4}$/)]],
      // Mandatory If Bank payment is true
      merchant_name: ['', [Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      Type: ['', [ Validators.maxLength(100)]],
      account_number: ['', [Validators.pattern(/[!^\w\s]$/)]],
      routing_number: ['', [ Validators.maxLength(9), Validators.pattern(/[!^\w\s]$/)]],
      bank_name: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z ]+$/)]],
      company_name: ['', [ Validators.maxLength(100), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // Non Mandatory
      s_mobile: ['', [Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
      comment: ['', [ Validators.maxLength(420)]],
      description: ['', [ Validators.maxLength(420)]],
    });
    this.productDetailsForm.get('is_card_payment').valueChanges
    // tslint:disable-next-line: variable-name
    .subscribe(is_card_payment => {
      if (is_card_payment === true) {
        this.productDetailsForm.get('first_name').setValidators(Validators.required);
        this.productDetailsForm.get('s_address1').setValidators(Validators.required);
        this.productDetailsForm.get('s_country').setValidators(Validators.required);
        this.productDetailsForm.get('s_state').setValidators(Validators.required);
        this.productDetailsForm.get('s_city').setValidators(Validators.required);
        this.productDetailsForm.get('s_zip_code').setValidators(Validators.required);
        this.productDetailsForm.get('card_number').setValidators(Validators.required);
        this.productDetailsForm.get('expiry_date').setValidators(Validators.required);
        this.productDetailsForm.get('cvv').setValidators(Validators.required);
        // Test
        this.productDetailsForm.get('merchant_name').setValidators(null);
        this.productDetailsForm.get('Type').setValidators(null);
        this.productDetailsForm.get('account_number').setValidators(null);
        this.productDetailsForm.get('routing_number').setValidators(null);
        this.productDetailsForm.get('bank_name').setValidators(null);
      }
      if (is_card_payment === false) {
        this.productDetailsForm.get('merchant_name').setValidators(Validators.required);
        this.productDetailsForm.get('Type').setValidators(Validators.required);
        this.productDetailsForm.get('account_number').setValidators(Validators.required);
        this.productDetailsForm.get('routing_number').setValidators(Validators.required);
        this.productDetailsForm.get('bank_name').setValidators(Validators.required);
        // Test
        this.productDetailsForm.get('first_name').setValidators(null);
        this.productDetailsForm.get('s_address1').setValidators(null);
        this.productDetailsForm.get('s_country').setValidators(null);
        this.productDetailsForm.get('s_state').setValidators(null);
        this.productDetailsForm.get('s_city').setValidators(null);
        this.productDetailsForm.get('s_zip_code').setValidators(null);
        this.productDetailsForm.get('card_number').setValidators(null);
        this.productDetailsForm.get('expiry_date').setValidators(null);
        this.productDetailsForm.get('cvv').setValidators(null);
      }
      this.productDetailsForm.get('first_name').updateValueAndValidity();
      this.productDetailsForm.get('s_address1').updateValueAndValidity();
      this.productDetailsForm.get('s_country').updateValueAndValidity();
      this.productDetailsForm.get('s_state').updateValueAndValidity();
      this.productDetailsForm.get('s_city').updateValueAndValidity();
      this.productDetailsForm.get('s_zip_code').updateValueAndValidity();
      this.productDetailsForm.get('card_number').updateValueAndValidity();
      this.productDetailsForm.get('expiry_date').updateValueAndValidity();
      this.productDetailsForm.get('cvv').updateValueAndValidity();
      this.productDetailsForm.get('merchant_name').updateValueAndValidity();
      this.productDetailsForm.get('Type').updateValueAndValidity();
      this.productDetailsForm.get('account_number').updateValueAndValidity();
      this.productDetailsForm.get('routing_number').updateValueAndValidity();
      this.productDetailsForm.get('bank_name').updateValueAndValidity();
    }
);
}
  // Method: to bind items for editing data to list in product's list
  bindEditCopyForm(data) {
    this.productDetailsForm = this.formBuilder.group({
      // Madatory Always
      // tslint:disable-next-line: max-line-length
      mobile: [data.merchant.mobile, [Validators.required, Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
      email: [data.merchant.email, [Validators.required, Validators.email]],
      address1: [data.merchant.address1, [Validators.required, Validators.maxLength(300)]],
      address2: [data.merchant.address2, [Validators.maxLength(200)]],
      // tslint:disable-next-line: max-line-length
      country: [data.merchant.country, [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      state: [data.merchant.state, [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      city: [data.merchant.city, [ Validators.required, Validators.minLength(5), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // tslint:disable-next-line: max-line-length
      zip_code: [data.merchant.zip_code, [ Validators.required, Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      // Mandatory If card payment is true
      is_card_payment: [data.merchant.is_card_payment, [Validators.required]],
      // Mandatory If card payment is true
      first_name: [data.merchant.first_name, [Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      // Non Mandatory
      last_name: [data.merchant.last_name, [ Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      s_address1: [data.merchant.s_address1, [ Validators.maxLength(420)]],
      s_address2: [data.merchant.s_address2, [ Validators.maxLength(420)]],
      s_country: [data.merchant.s_country, [ Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_state: [data.merchant.s_state, [Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_city: [data.merchant.s_city, [Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      s_zip_code: [data.merchant.s_zip_code, [Validators.minLength(5), Validators.maxLength(7), Validators.pattern(/^\d{5}(?:\d{2})?$/)]],
      // tslint:disable-next-line: max-line-length
      card_number: [data.merchant.card_number, [Validators.pattern(/^((?:4\d{3})|(?:5[1-5]\d{2})|(?:6011)|(?:3[68]\d{2})|(?:30[012345]\d))[ -]?(\d{4})[ -]?(\d{4})[ -]?(\d{4}|3[4,7]\d{13})$/)]],
      expiry_date: [data.merchant.expiry_date, [Validators.pattern(/^\d{1,2}\/\d{2}$/)]],
      cvv: [data.merchant.cvv, [ Validators.pattern(/^[0-9]{3,4}$/)]],
      // Mandatory If Bank payment is true
      // tslint:disable-next-line: max-line-length
      merchant_name: [data.merchant.merchant_name, [Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      Type: [data.merchant.Type, [ Validators.maxLength(100)]],
      account_number: [data.merchant.account_number, [Validators.pattern(/[!^\w\s]$/)]],
      routing_number: [data.merchant.routing_number, [ Validators.maxLength(9), Validators.pattern(/[!^\w\s]$/)]],
      bank_name: [data.merchant.bank_name, [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z ]+$/)]],
      company_name: [data.merchant.company_name, [ Validators.maxLength(100), Validators.pattern(/^[a-zA-Z ]+$/)]],
      // Non Mandatory
      s_mobile: [data.merchant.s_mobile, [Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
      comment: [data.merchant.comment, [ Validators.maxLength(420)]],
      description: [data.merchant.description, [ Validators.maxLength(420)]],
    });
    this.productDetailsForm.get('is_card_payment').valueChanges
    // tslint:disable-next-line: variable-name
    .subscribe(is_card_payment => {
      if (is_card_payment === true) {
        this.productDetailsForm.get('first_name').setValidators(Validators.required);
        this.productDetailsForm.get('s_address1').setValidators(Validators.required);
        this.productDetailsForm.get('s_country').setValidators(Validators.required);
        this.productDetailsForm.get('s_state').setValidators(Validators.required);
        this.productDetailsForm.get('s_city').setValidators(Validators.required);
        this.productDetailsForm.get('s_zip_code').setValidators(Validators.required);
        this.productDetailsForm.get('card_number').setValidators(Validators.required);
        this.productDetailsForm.get('expiry_date').setValidators(Validators.required);
        this.productDetailsForm.get('cvv').setValidators(Validators.required);
        // Test
        this.productDetailsForm.get('merchant_name').setValidators(null);
        this.productDetailsForm.get('Type').setValidators(null);
        this.productDetailsForm.get('account_number').setValidators(null);
        this.productDetailsForm.get('routing_number').setValidators(null);
        this.productDetailsForm.get('bank_name').setValidators(null);
      }
      if (is_card_payment === false) {
        this.productDetailsForm.get('merchant_name').setValidators(Validators.required);
        this.productDetailsForm.get('Type').setValidators(Validators.required);
        this.productDetailsForm.get('account_number').setValidators(Validators.required);
        this.productDetailsForm.get('routing_number').setValidators(Validators.required);
        this.productDetailsForm.get('bank_name').setValidators(Validators.required);
        // Test
        this.productDetailsForm.get('first_name').setValidators(null);
        this.productDetailsForm.get('s_address1').setValidators(null);
        this.productDetailsForm.get('s_country').setValidators(null);
        this.productDetailsForm.get('s_state').setValidators(null);
        this.productDetailsForm.get('s_city').setValidators(null);
        this.productDetailsForm.get('s_zip_code').setValidators(null);
        this.productDetailsForm.get('card_number').setValidators(null);
        this.productDetailsForm.get('expiry_date').setValidators(null);
        this.productDetailsForm.get('cvv').setValidators(null);
      }
      this.productDetailsForm.get('first_name').updateValueAndValidity();
      this.productDetailsForm.get('s_address1').updateValueAndValidity();
      this.productDetailsForm.get('s_country').updateValueAndValidity();
      this.productDetailsForm.get('s_state').updateValueAndValidity();
      this.productDetailsForm.get('s_city').updateValueAndValidity();
      this.productDetailsForm.get('s_zip_code').updateValueAndValidity();
      this.productDetailsForm.get('card_number').updateValueAndValidity();
      this.productDetailsForm.get('expiry_date').updateValueAndValidity();
      this.productDetailsForm.get('cvv').updateValueAndValidity();
      this.productDetailsForm.get('merchant_name').updateValueAndValidity();
      this.productDetailsForm.get('Type').updateValueAndValidity();
      this.productDetailsForm.get('account_number').updateValueAndValidity();
      this.productDetailsForm.get('routing_number').updateValueAndValidity();
      this.productDetailsForm.get('bank_name').updateValueAndValidity();
    }
);
}
// Method: sending user details to BE
saveProductDetails(data: any) {
  this.submitted = true;
  // stop here if form is invalid
  if (this.productDetailsForm.invalid) {
      return;
  }
  if (this.productDetailsForm.valid) {
    if ( data.valid === true) {
      this.checkProductFormValidation = false;
      const requestObj: any = {
        mobile: !!data.value.mobile ? +data.value.mobile : null,
        email: !!data.value.email ? data.value.email : null,
        address1: !!data.value.address1 ? data.value.address1 : null,
        address2: !!data.value.address2 ? data.value.address2 : null,
        country: !!data.value.country ? data.value.country : null,
        state: !!data.value.state ? data.value.state : null,
        city: !!data.value.city ? data.value.city : null,
        zip_code: !!data.value.zip_code ? +data.value.zip_code : null,
      };
      // For Edit Condition
      if (!!this.UserId) {
        requestObj.merchant_id = this.UserId;
      }
      if (data.value.is_card_payment === true) {
        requestObj.is_card_payment = true;
        requestObj.is_bank_payment = false;
        requestObj.first_name = !!data.value.first_name ? data.value.first_name : null;
        requestObj.last_name = !!data.value.first_name ? data.value.last_name : null;
        requestObj.s_mobile = !!data.value.s_mobile ? +data.value.s_mobile : null;
        requestObj.s_address1 = !!data.value.s_address1 ? data.value.s_address1 : null;
        requestObj.s_address2 = !!data.value.s_address2 ? data.value.s_address2 : null;
        requestObj.s_country = !!data.value.s_country ? data.value.s_country : null;
        requestObj.s_state = !!data.value.s_state ? data.value.s_state : null;
        requestObj.s_city = !!data.value.s_city ? data.value.s_city : null;
        requestObj.s_zip_code = !!data.value.s_zip_code ? +data.value.s_zip_code : null;
        requestObj.card_number = !!data.value.card_number ? +data.value.card_number : null;
        requestObj.expiry_date = !!data.value.expiry_date ? data.value.expiry_date : null;
        requestObj.cvv = !!data.value.cvv ? +data.value.cvv : null;
        requestObj.comment = !!data.value.comment ? data.value.comment : null;

      } else {
        requestObj.is_card_payment = false;
        requestObj.is_bank_payment = true;
        requestObj.merchant_name = !!data.value.merchant_name ? data.value.merchant_name : null;
        requestObj.Type = !!data.value.Type ? data.value.Type : null;
        requestObj.account_number = !!data.value.account_number ? +data.value.account_number : null;
        requestObj.routing_number = !!data.value.routing_number ? +data.value.routing_number : null;
        requestObj.bank_name = !!data.value.bank_name ? data.value.bank_name : null;
        requestObj.company_name = !!data.value.company_name ? data.value.company_name : null;
        requestObj.description = !!data.value.description ? data.value.description : null;
      }
      // tslint:disable-next-line: radix
      data.value.merchant_id = (this.UserId);
      this.merchantService.editMerchantData(requestObj).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_merchant_updated === true ) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.router.navigate(['/merchants'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
      // this.merchantService.createProductData(requestObj).subscribe(
      //     response => {
      //       if (!!response && response.data.is_merchant_updated === true) {
      //           this.toastrService.showSuccess('Edited Succesfully', response.message);
      //           this.router.navigate(['/merchants/'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
      //       } else {
      //         this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
      //       }
      //     },
      //     err => console.error(err)
      //   );
      } else {
      this.checkProductFormValidation = true;
      this.toastrService.showError('Error', 'Provided data is not in correct format');
    }
  }
}

// End of code
}
