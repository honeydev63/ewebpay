import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerListingComponent } from 'src/app/echeckout/customer/components/customer-listing/customer-listing.component';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ViewCustomerComponent } from './components/view-customer/view-customer.component';
import { EditCustomerComponent } from './components/edit-customer/edit-customer.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateCustomerComponent } from './components/create-customer/create-customer.component';
const CustomerRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: CustomerListingComponent},
      { path: 'view-customer', component: ViewCustomerComponent },
      { path: 'edit-customer', component: EditCustomerComponent },
      { path: 'create-customer', component: CreateCustomerComponent }
    ]
  }
];

@NgModule({
  declarations: [
    CustomerListingComponent,
    ViewCustomerComponent,
    EditCustomerComponent,
    CreateCustomerComponent
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    NgxDatatableModule,
    RouterModule.forChild(CustomerRoutes),
    NgxDaterangepickerMd.forRoot()
  ]
})
export class CustomerModule { }

