import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { FormBuilder } from '@angular/forms';
import { MerchantService } from '../../services/merchant.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportPdfFile } from 'src/app/core/utilities/export-pdf';

@Component({
  selector: 'app-view-merchant',
  templateUrl: './view-merchant.component.html',
  styleUrls: ['./view-merchant.component.scss']
})
export class ViewMerchantComponent implements OnInit {
  sub: any;
  merchantId: number;
  merchantData: any;
  constructor(
    private formBuilder: FormBuilder,
    private merchantService: MerchantService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
    private auth: AuthService
  ) {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.merchantId = params.id;
      this.getMerchantData(this.merchantId);
      }
    });
   }

  ngOnInit() {
  }
    // End of above code
  // Method:to fetch details for merchant in  merchant's list
  getMerchantData(cId) {
    const queryObj = {
      merchant_id: cId
    };
    const merchantQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.merchantService.getMerchantDataByID(merchantQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_merchant_exist === true) {
            this.merchantData = response.data.merchant;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/merchants']);
          }
      },
      err => console.error(err)
    );
  }
  // End of above code
  // Method:to navigate back
  merchantViewBack() {
    window.history.back();
  }
}
