import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';

@Component({
  selector: 'app-create-customer',
  templateUrl: './create-customer.component.html',
  styleUrls: ['./create-customer.component.scss']
})
export class CreateCustomerComponent implements OnInit {
  otpSent = false;
  submitted = false;
  createCustomerForm: FormGroup;
  constructor(
    private router: Router,
    private customerService: CustomerService,
    private toastrService: EpharmaToasterService,
    private formBuilder: FormBuilder
  ) {}
  ngOnInit() {
    this.bindCustomerCreate();
  }
  // Method: used to bind the customer Form
  bindCustomerCreate() {
    this.createCustomerForm = this.formBuilder.group({
      // Madatory Always
      first_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z .]+$/)]],
      mobile: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/)]],
      email: ['', [Validators.required, Validators.email]],
      mobile_otp: [null],
      email_otp: [null],
    });
  }
  // End of the above code
  // Method: Which is used to resend the OTP
  resendOtp() {
    console.log('The Form is ', this.createCustomerForm);
    this.customerService.resendOtp(this.createCustomerForm.value).subscribe(
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
  // Method: Which is used for OTP sent and Verify the Customer Email and Mobile while creating Customer with Sales Agent and Admin
  saveCustomer(form) {
    this.submitted = true;
    if (form.valid === true) {
      if (this.otpSent === true) { // Verifying the Customer and Creating Customer
        if (!(!!this.createCustomerForm.get('email_otp').value ||  !!this.createCustomerForm.get('mobile_otp').value)) {
          this.toastrService.showError('Error', 'Please fill email or mobile otp');
          return false;
        }
        this.customerService.createCustomerVerifySent(form.value).subscribe(
          response => {
            if (!!response && !!response.data) {
              if (response.data.is_customer_created === true ) {
                this.toastrService.showSuccess('Success', response.data.message);
                this.router.navigate(['/customers'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
      } else { // For Sending the OTP to the customer Mobile and Email ID
        this.customerService.createCustomerOtpSent(form.value).subscribe(
          response => {
            if (!!response && !!response.data) {
              if (response.data.is_otp_sent === true ) {
                this.toastrService.showSuccess('Success', response.data.message);
                this.otpSent = true;
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
    } else {
      this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
    }
  }
  // End of the above code
}
