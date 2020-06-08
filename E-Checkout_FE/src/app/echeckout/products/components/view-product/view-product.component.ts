import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { ProductsService } from '../../services/products.service';
import { UserRole } from 'src/app/core/dictionary/user-role';

@Component({
  selector: 'app-view-product',
  templateUrl: './view-product.component.html',
  styleUrls: ['./view-product.component.scss']
})
export class ViewProductComponent implements OnInit {
  sub: any;
  productId: number;
  responseCode = ResponseCode;
  productData: any;
  constructor(
    private formBuilder: FormBuilder,
    private inventoryService: ProductsService,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
  ) {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.productId = params.id;
      this.getProductData(this.productId);
      }
    });
   }

  ngOnInit() {
  }
  getProductData(pId) {
    const queryObj = {
      product_id: pId
    };
    console.log(queryObj);
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.inventoryService.getProductDataById(productQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_product_exist === true) {
            this.productData = response.data.product;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/products']);
          }
      },
      err => console.error(err)
    );
  }
  viewProductBack() {
    window.history.back();
  }
}
