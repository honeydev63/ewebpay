import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { ProductsListingComponent } from 'src/app/echeckout/products/components/products-listing/products-listing.component';
import { AeProductsComponent } from 'src/app/echeckout/products/components/ae-products/ae-products.component';
import { ViewProductComponent } from './components/view-product/view-product.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
const InventoryRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: ProductsListingComponent },
      { path: 'product', component: AeProductsComponent },
      { path: 'view', component: ViewProductComponent }
    ]
  }
];

@NgModule({
  declarations: [
    ProductsListingComponent,
    AeProductsComponent,
    ViewProductComponent
  ],
  imports: [
    SharedModule,
    NgxDatatableModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(InventoryRoutes),
    NgxDaterangepickerMd.forRoot(),
  ]
})
export class ProductsModule { }
