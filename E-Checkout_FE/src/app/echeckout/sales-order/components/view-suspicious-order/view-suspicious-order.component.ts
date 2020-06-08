import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SalesOrdersService } from '../../services/sales-order.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { FormBuilder } from '@angular/forms';
import { AuthService } from 'src/app/core/auth/auth.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-view-suspicious-order',
  templateUrl: './view-suspicious-order.component.html',
  styleUrls: ['./view-suspicious-order.component.scss']
})
export class ViewSuspiciousOrderComponent implements OnInit {
  sub: any;
  orderId: number;
  responseCode = ResponseCode;
  orderData: any;
  constructor(private formBuilder: FormBuilder,
              private salesOrderService: SalesOrdersService,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: EpharmaToasterService,
              private auth: AuthService) {
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
  getOrderData(pId) {
    const queryObj = {
      order_id: pId
    };
    console.log(queryObj);
    const orderQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.salesOrderService.getSuspiciousOrderViewDataByID(orderQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_order_exist === true) {
            this.orderData = response.data.user;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/sales-orders/suspicious-listing']);
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
