import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { IDatePickerConfig } from 'ng2-date-picker';
import * as moment from 'moment';

@Component({
  selector: 'app-ae-products',
  templateUrl: './ae-products.component.html',
  styleUrls: ['./ae-products.component.scss']
})
export class AeProductsComponent implements OnInit {
  productDetailsForm: FormGroup;
  checkProductFormValidation = false;
  form: any;
  sub: any;
  UserFormType: string;
  UserId: number;
  Userobj: any = {};
  productDetailsObj: any = {};
  constructor(private formBuilder: FormBuilder,
              private productsService: ProductsService,
              private router: Router,
              private route: ActivatedRoute,
              private toastrService: EpharmaToasterService) {
                this.sub = this.route
                .queryParams
                .subscribe(params => {
                  this.UserFormType = params.type;
                  if ( this.UserFormType !== 'add') {
                    this.UserId = params.id;
                    this.getProductData(this.UserId);
                  } else {
                    this.bindAddForm();
                  }
                });
               }

  ngOnInit() {
  }
  getProductData(pId) {
    const queryObj = {
      product_id : pId
    };
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.productsService.getProductDataById(productQueryStr).subscribe(
      response => {
        if ( !!response && !! response.data && response.data.is_product_exist === true) {
          this.bindEditForm(response.data.product);
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/products/']);
          }
      },
      err => console.error(err)
    );
  }
  // End of above code
  // Method: to bind items for adding data to list in product's list
  bindAddForm() {
    this.productDetailsForm = this.formBuilder.group({
      product_id: [''],
      product_name: ['', [Validators.required, Validators.maxLength(100)]],
      product_type: ['', [Validators.required, Validators.maxLength(100)]],
      price: [null, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9.]+$/)]]
    });
  }
  // End of above code
  // Method: to bind items for editing data to list in product's list
  bindEditForm(data) {
    this.productDetailsForm = this.formBuilder.group({
      product_id: [{ value: !!data.product_id ? data.product_id : null, disabled: true}],
      // tslint:disable-next-line: max-line-length
      product_name: [!!data.product_name ? data.product_name : null, [Validators.required, Validators.maxLength(100)]],
      // tslint:disable-next-line: max-line-length
      product_type: [!!data.product_type ? data.product_type : null, [Validators.required, Validators.maxLength(100)]],
      price: [!!data.price ? data.price : null, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9.]+$/)]]
    });
  }
// Method: sending user details to BE
saveProductDetails(data: any) {
  if ( data.valid === true) {
    this.checkProductFormValidation = false;
    if (this.UserFormType === 'edit') {
      // tslint:disable-next-line: radix
      data.value.product_id = +(this.UserId);
      data.value.price = +(data.value.price);
      this.productsService.editProductData(data.value).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_product_updated === true ) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.router.navigate(['/products'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
          } else {
            this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
          }
        },
        err => {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
          console.error(err);
        }
      );
    } else {
      this.productsService.saveProductData(data.value).subscribe(
        response => {
          if (!!response && !!response.data ) {
            if (response.data.is_product_added === true ) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.router.navigate(['/products'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
          } else {
            this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
          }
        },
        err => {
          this.toastrService.showError('Error', 'Something went Wrong. Please try again later !!!');
          console.error(err);
        }
      );
    }
  } else {
    this.checkProductFormValidation = true;
    this.toastrService.showError('Error', 'Provided data is not in correct format');
  }
}
}
