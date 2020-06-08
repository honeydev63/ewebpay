import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { QaListingComponent } from './components/qa-agent-listing/qa-listing.component';
import { AeQaAgentComponent } from './components/ae-agent/ae-agent.component';
import { QaDashboardComponent } from './components/dashboard/dashboard.component';
import { QaOrderListingComponent } from './components/qa-order-listing/qa-order-listing.component';
import { ViewQAAgentComponent } from './components/view-agent/view-agent.component';
import { ViewQaOrderComponent } from './components/view-qa-order/view-qa-order.component';
import { QaSuspiciousListingComponent } from './components/qa-suspicious-listing/qa-suspicious-listing.component';
import { ResolvedOrderListingComponent } from './components/resolved-order-listing/resolved-order-listing.component';
const QARoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: QaListingComponent},
      { path: 'ae-qaagent', component: AeQaAgentComponent},
      { path: 'view-agent', component: ViewQAAgentComponent},
      { path: 'view-order', component: ViewQaOrderComponent},
      { path: 'orders-listing', component: QaOrderListingComponent},
      { path: 'qa-dashboard', component: QaDashboardComponent},
      { path: 'suscpicious-listing', component: QaSuspiciousListingComponent},
      { path: 'resolved-order-listing', component: ResolvedOrderListingComponent},
    ]
  }
];

@NgModule({
  declarations: [
    QaListingComponent,
    AeQaAgentComponent,
    ViewQAAgentComponent,
    QaOrderListingComponent,
    QaDashboardComponent,
    QaOrderListingComponent,
    ViewQaOrderComponent,
    QaSuspiciousListingComponent,
    ResolvedOrderListingComponent
  ],
  imports: [
    SharedModule,
    NgxDatatableModule,
    RouterModule.forChild(QARoutes),
    NgxDaterangepickerMd.forRoot()
  ]
})
export class QAModule { }

