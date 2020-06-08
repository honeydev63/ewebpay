import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { WorkOrderListingComponent } from './components/work-order-listing/work-order-listing.component';
const CustomerRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: WorkOrderListingComponent},
    ]
  }
];

@NgModule({
  declarations: [
  WorkOrderListingComponent],
  imports: [
    SharedModule,
    NgxDatatableModule,
    RouterModule.forChild(CustomerRoutes),
    NgxDaterangepickerMd.forRoot()
  ]
})
export class WorkOrderModule { }

