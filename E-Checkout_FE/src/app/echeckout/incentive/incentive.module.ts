import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { IncentiveListingComponent } from './components/incentive-listing/incentive-listing.component';
import { AeIncentiveComponent } from './components/ae-incentive/ae-incentive.component';
import { ViewIncentiveComponent } from './components/view-incentive/view-incentive.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
const IncentiveRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: IncentiveListingComponent},
      { path: 'incentive', component: AeIncentiveComponent},
      { path: 'view-incentive', component: ViewIncentiveComponent}
    ]
  }
];

@NgModule({
  declarations: [
    IncentiveListingComponent,
    AeIncentiveComponent,
    ViewIncentiveComponent
  ],
  imports: [
    SharedModule,
    NgxDatatableModule,
    RouterModule.forChild(IncentiveRoutes)
  ]
})
export class IncentiveModule { }
