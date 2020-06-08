import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { FormBuilder } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportPdfFile } from 'src/app/core/utilities/export-pdf';

@Component({
  selector: 'app-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss']
})
export class ViewCustomerComponent implements OnInit {
  sub: any;
  customerId: number;
  customerData: any;
  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
    private auth: AuthService
  ) {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.customerId = params.id;
      this.getCustomerData(this.customerId);
      }
    });
   }

  ngOnInit() {
  }
    // End of above code
  // Method:to fetch details for customer in  customer's list
  getCustomerData(cId) {
    const queryObj = {
      customer_id: cId
    };
    const customerQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.customerService.getCustomerDataByID(customerQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_customer_exist === true) {
            this.customerData = response.data.customer;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/customers']);
          }
      },
      err => console.error(err)
    );
  }
  // End of above code
  // Method:to navigate back
  customerViewBack() {
    window.history.back();
  }
}
