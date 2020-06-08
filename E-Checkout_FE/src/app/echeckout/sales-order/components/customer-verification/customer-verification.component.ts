import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { SalesOrdersService } from '../../services/sales-order.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-customer-verification',
  templateUrl: './customer-verification.component.html',
  styleUrls: ['./customer-verification.component.scss']
})
export class CustomerVerificationComponent implements OnInit {
  otpDetailsForm: FormGroup;
  checkOtpFormValidation = false;
  form: any;
  orderId: number;
  sub: any;
  orderData: any;
  verificationid: any;
  UserFormType: string;
  UserId: number;
  Userobj: any = {};
  productDetailsObj: any = {};
  constructor(private formBuilder: FormBuilder,
              private salesService: SalesOrdersService ,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: EpharmaToasterService) {
                this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.orderId = params.id;
      }
    });
               }
  ngOnInit() {
    this.bindAddForm();
  }
// Method: to bind items for adding data to list in product's list
bindAddForm() {
  this.otpDetailsForm = this.formBuilder.group({
   // order_id: [data.order_id],
    mobile_otp: [null, ],
    email_otp: [null],
  });
}
openChangeStatus(data: any) {
  this.
  verificationid = data;
}
// Method: sending Agent details to BE
saveDetails(data: any) {
  console.log(data.value);
  if ( data.valid === true) {
  this.checkOtpFormValidation = false;
  if (!(!!this.otpDetailsForm.get('email_otp').value ||  !!this.otpDetailsForm.get('mobile_otp').value)) {
    this.toastrService.showError('Error', 'Please fill email or mobile otp');
    return false;
  }
  const req = {
      mobile_otp : this.otpDetailsForm.get('mobile_otp').value,
      order_id : this.orderId,
      email_otp : this.otpDetailsForm.get('email_otp').value,
    };
  if ( !!req.mobile_otp || !!req.email_otp) {
    this.salesService.verify(req).subscribe(
      response => {
        if (!!response && !!response.data ) {
          if (response.data.is_customer_verified === true ) {
            this.toastrService.showSuccess('Success', response.data.message);
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/sales-orders'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
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
  }
} else {
  this.checkOtpFormValidation = true;
  this.toastrService.showError('Error', 'Please fill email or mobile otp');
}
}
resendOtp() {
  const req = {
    order_id : this.orderId,
  };
  this.salesService.resendOtp(req).subscribe(
      response => {
        if (!!response && !!response.data ) {
          if (response.data.is_otp_resent === true ) {
            this.toastrService.showSuccess('Success', response.data.message);
            // tslint:disable-next-line: max-line-length
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
        }
      },
      err => console.error(err)
    );
}
}
