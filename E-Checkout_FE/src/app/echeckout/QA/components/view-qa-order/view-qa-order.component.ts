import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { QAService } from '../../services/qa.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-view-qa-order',
  templateUrl: './view-qa-order.component.html',
  styleUrls: ['./view-qa-order.component.scss']
})
export class ViewQaOrderComponent implements OnInit {
  sub: any;
  orderId: number;
  orderData: any;
  constructor( private formBuilder: FormBuilder,
               private qaService: QAService ,
               private router: Router,
               private route: ActivatedRoute,
               private toastrService: EpharmaToasterService, ) {
                this.sub = this.route
                .queryParams
                .subscribe(params => {
                  if (!!params.id && params.id !== '') {
                  this.orderId = params.id;
                  this.getOrderData(this.orderId);
                  }
                });
                }

  ngOnInit() {
  }
  // Method: to fetch details for order form BE
  getOrderData(aId) {
    const queryObj = {
      order_id: aId
    };
    console.log(queryObj);
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.qaService.getQaOrderDataById(productQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_order_exist === true) {
            this.orderData = response.data.user;
          } else {
            this.toastrService.showError('Error', 'Something went wrongs. Please Try again latter');
            this.router.navigate(['/qa/orders-listing'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          }
      },
      err => console.error(err)
    );
  }
  // End of above coee
  viewOrderBack() {
    window.history.back();
  }
}
//  End of code
