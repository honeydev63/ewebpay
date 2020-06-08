import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';

@Component({
  selector: 'app-create-merchant',
  templateUrl: './create-merchant.component.html',
  styleUrls: ['./create-merchant.component.scss']
})
export class CreateMerchantComponent implements OnInit {
  otpSent = false;
  submitted = false;
  createMerchantForm: FormGroup;
  constructor(
    private router: Router,
    private merchantService: MerchantService,
    private toastrService: EpharmaToasterService,
    private formBuilder: FormBuilder
  ) {}
  ngOnInit() {
    this.bindMerchantCreate();
  }
  // Method: used to bind the merchant Form
  bindMerchantCreate() {
    this.createMerchantForm = this.formBuilder.group({
      // Madatory Always
      legal_entity_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      // address_line1: ['', [Validators.required]],
      // address_line2: ['', [Validators.required]],
      // address_city: ['', [Validators.required]],
      // address_state: ['', [Validators.required]],
      // address_zipcode: ['', [Validators.required]],
      // payment_gateway: ['', [Validators.required]],
      // provider_name: ['', [Validators.required]],
      // descriptor: ['', [Validators.required]],
      // alias: ['', [Validators.required]],
      // credential: ['', [Validators.required]],
      // profile_id: ['', [Validators.required]],
      // profile_key: ['', [Validators.required]],
      // currency: ['', [Validators.required]],
      // merchant_id: ['', [Validators.required]],
      // limit_n_fees: ['', [Validators.required]],
      // global_monthly_cap: ['', [Validators.required]],
      // daily_cap: ['', [Validators.required]],
      // weekly_cap: ['', [Validators.required]],
      // account_details: ['', [Validators.required]],
      // customer_service_email: ['', [Validators.required]],
      // customer_service_email_from: ['', [Validators.required]],
      // gateway_url: ['', [Validators.required]],
      // transaction_fee: ['', [Validators.required]],
      // batch_fee: ['', [Validators.required]],
      // monthly_fee: ['', [Validators.required]],
      // chargeback_fee: ['', [Validators.required]],
      // refund_processing_fee: ['', [Validators.required]],
      // reserve_percentage: ['', [Validators.required]],
      // reserve_term_rolling: ['', [Validators.required]],
      // reserve_term_days: ['', [Validators.required]],

      mobile: ['', [Validators.required, Validators.min(0), Validators.pattern('[6-9]\\d{9}')]],
      email: ['', [Validators.required, Validators.email]],
      address_line1: [''],
      address_line2: [''],
      address_city: [''],
      address_state: [''],
      address_zipcode: [''],
      payment_gateway: [''],
      provider_name: [''],
      descriptor: [''],
      alias: [''],
      credential: [''],
      profile_id: [''],
      profile_key: [''],
      currency: [''],
      merchant_id: [''],
      limit_n_fees: [''],
      global_monthly_cap: [''],
      daily_cap: [''],
      weekly_cap: [''],
      account_details: [''],
      customer_service_email: [''],
      customer_service_email_from: [''],
      gateway_url: [''],
      transaction_fee: [''],
      batch_fee: [''],
      monthly_fee: [''],
      chargeback_fee: [''],
      refund_processing_fee: [''],
      reserve_percentage: [''],
      reserve_term_rolling: [''],
      reserve_term_days: ['']
    });
  }
  // End of the above code
  // Method: Which is used to resend the OTP
  resendOtp() {
    console.log('The Form is ', this.createMerchantForm);
    this.merchantService.resendOtp(this.createMerchantForm.value).subscribe(
        response => {
          if (!!response && !!response.data ) {
            if (response.data.is_otp_sent === true ) {
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
  // End of the above code
  // Method: Which is used for OTP sent and Verify the Merchant Email and Mobile while creating Merchant with Sales Agent and Admin
  saveMerchant(form) {
    this.submitted = true;
    if (form.valid === true) {
      if (this.otpSent === true) { // Verifying the Merchant and Creating Merchant
        if (!(!!this.createMerchantForm.get('email_otp').value ||  !!this.createMerchantForm.get('mobile_otp').value)) {
          this.toastrService.showError('Error', 'Please fill email or mobile otp');
          return false;
        }
        this.merchantService.createMerchantVerifySent(form.value).subscribe(
          response => {
            if (!!response && !!response.data) {
              if (response.data.is_merchant_created === true ) {
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
      } else { // For Sending the OTP to the merchant Mobile and Email ID
        this.merchantService.createMerchantOtpSent(form.value).subscribe(
          response => {
            if (!!response && !!response.data) {
                alert('This Password is Visible only for one time. Please note it down or reset again to see new password. New Password is : ' + response.data.password);
                // this.toastrService.showSuccess('Success', response.data.message);
                this.router.navigate(['/merchant'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
    } else {
      this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
    }
  }
  // End of the above code
}
