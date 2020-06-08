import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesOrderListingComponent } from 'src/app/echeckout/sales-order/components/sales-order-listing/sales-order-listing.component';
import { ViewSalesOrderComponent } from 'src/app/echeckout/sales-order/components/view-sales-order/view-sales-order.component';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { BankCheckoutComponent } from './components/bank-checkout/bank-checkout.component';
import { CardCheckoutComponent } from './components/card-checkout/card-checkout.component';
import { LinkCheckoutComponent } from './components/link-checkout/link-checkout.component';
import { CustomerVerificationComponent } from './components/customer-verification/customer-verification.component';
import { SuspiciousOrderListingComponent } from './components/suspicious-order-listing/suspicious-order-listing.component';
import { ViewSuspiciousOrderComponent } from './components/view-suspicious-order/view-suspicious-order.component';
const OrdersRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: SalesOrderListingComponent},
      { path: 'view-order', component: ViewSalesOrderComponent},
      { path: 'customer-verification', component: CustomerVerificationComponent},
      { path: 'bank-checkout', component: BankCheckoutComponent},
      // { path: 'card-checkout', component: CardCheckoutComponent},
      { path: 'card-checkout', component: LinkCheckoutComponent},
      { path: 'link-checkout', component: LinkCheckoutComponent},
      { path: 'suspicious-listing', component: SuspiciousOrderListingComponent},
      { path: 'view-suspicious-order', component: ViewSuspiciousOrderComponent}
    ]
  }
];

@NgModule({
  declarations: [
    SalesOrderListingComponent,
    ViewSalesOrderComponent,
    BankCheckoutComponent,
    CardCheckoutComponent,
    LinkCheckoutComponent,
    CustomerVerificationComponent,
    SuspiciousOrderListingComponent,
    ViewSuspiciousOrderComponent
  ],
  imports: [
    SharedModule,
    NgxDatatableModule,
    RouterModule.forChild(OrdersRoutes),
    NgxDaterangepickerMd.forRoot()
  ]
})
export class SalesOrdersModule { }

