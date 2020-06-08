import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { UserCheckoutComponent } from 'src/app/echeckout/user-checkout/user-checkout.component';
import { SharedModule } from './shared/shared.module';
import { AuthGuard } from './core/auth/auth.guard';


const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'authentication'},
  { path: 'authentication', loadChildren: 'src/app/echeckout/authentication/authentication.module#AuthenticationModule'},
  { path: 'products', loadChildren: 'src/app/echeckout/products/products.module#ProductsModule'},
  { path: 'sales-orders', loadChildren: 'src/app/echeckout/sales-order/sales-order.module#SalesOrdersModule'},
  { path: 'sales-agent', loadChildren: 'src/app/echeckout/sales-agent/sales-agent.module#SalesAgentModule'},
  { path: 'incentives', loadChildren: 'src/app/echeckout/incentive/incentive.module#IncentiveModule'},
  { path: 'customers', loadChildren: 'src/app/echeckout/customer/customer.module#CustomerModule'},
  { path: 'merchants', loadChildren: 'src/app/echeckout/merchant/merchant.module#MerchantModule'},
  { path: 'work-order', loadChildren: 'src/app/echeckout/work-order/work-order.module#WorkOrderModule'},
  { path: 'qa', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'qa/orders-listing', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'qa/suspicious-listing', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'qa/flaged-listing', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'qa/qa-dashboard', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'sales-orders/suspicious-listing', loadChildren: 'src/app/echeckout/QA/qa.module#QAModule'},
  { path: 'user-checkout', component: UserCheckoutComponent},
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forRoot(routes)],
  declarations: [
    UserCheckoutComponent
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
