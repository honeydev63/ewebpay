import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { FormBuilder } from '@angular/forms';
import { SalesOrdersService } from '../../services/sales-order.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { AuthService } from 'src/app/core/auth/auth.service';
import { ExportPdfFile } from 'src/app/core/utilities/export-pdf';

@Component({
  selector: 'app-view-sales-order',
  templateUrl: './view-sales-order.component.html',
  styleUrls: ['./view-sales-order.component.scss']
})
export class ViewSalesOrderComponent implements OnInit {
  sub: any;
  orderId: number;
  responseCode = ResponseCode;
  orderData: any;
  downloadPdfEntity = new ExportPdfFile(this.auth, this.toastrService);
  constructor(
    private formBuilder: FormBuilder,
    private salesOrderService: SalesOrdersService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
    private auth: AuthService
  ) {
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
    this.salesOrderService.getOrderViewDataByID(orderQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_order_exist === true) {
            this.orderData = response.data.user;
            console.log('The Order Data is ', this.orderData);
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/sales-orders/']);
          }
      },
      err => console.error(err)
    );
  }
  //  Method: which is used when user click on the download Invoice
  downloadInvoice(data: any) {
    if (!!data && data.order_id) {
      this.downloadPdfEntity.getPdfData('sales-order', 'download', data.order_id);
    } else {
      this.toastrService.showError('Error', 'Sometime went wrong, Please try again later !!!');
    }
  }
  // End of the above code
  //  Method: which is used when user click on the print Invoice
  printInvoice(data: any) {
    if (!!data && data.order_id) {
      this.downloadPdfEntity.getPdfData('sales-order', 'print', data.order_id);
    } else {
      this.toastrService.showError('Error', 'Sometime went wrong, Please try again later !!!');
    }
  }
  // End of the above code
}
