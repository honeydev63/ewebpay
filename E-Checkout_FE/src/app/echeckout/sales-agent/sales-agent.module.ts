import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SalesAgentListingComponent } from './components/sales-agent-listing/sales-agent-listing.component';
import { AeSalesAgentComponent } from './components/ae-sales-agent/ae-sales-agent.component';
import { ViewSalesAgentComponent } from './components/view-sales-agent/view-sales-agent.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
const SalesAgentRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: SalesAgentListingComponent},
      { path: 'agent', component: AeSalesAgentComponent},
      { path: 'view-sales-agent', component: ViewSalesAgentComponent}
    ]
  }
];

@NgModule({
  declarations: [
    SalesAgentListingComponent,
    AeSalesAgentComponent,
    ViewSalesAgentComponent
  ],
  imports: [
    SharedModule,
    NgxDatatableModule,
    RouterModule.forChild(SalesAgentRoutes)
  ]
})
export class SalesAgentModule { }
