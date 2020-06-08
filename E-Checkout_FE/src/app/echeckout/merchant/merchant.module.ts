import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantListingComponent } from 'src/app/echeckout/merchant/components/merchant-listing/merchant-listing.component';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ViewMerchantComponent } from './components/view-merchant/view-merchant.component';
import { EditMerchantComponent } from './components/edit-merchant/edit-merchant.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateMerchantComponent } from './components/create-merchant/create-merchant.component';
const MerchantRoutes: Routes = [
  {
    path: '',
    component: EcheckoutLayoutComponent,
    children: [
      { path: '', component: MerchantListingComponent},
      { path: 'view-merchant', component: ViewMerchantComponent },
      { path: 'edit-merchant', component: EditMerchantComponent },
      { path: 'create-merchant', component: CreateMerchantComponent }
    ]
  }
];

@NgModule({
  declarations: [
    MerchantListingComponent,
    ViewMerchantComponent,
    EditMerchantComponent,
    CreateMerchantComponent
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    NgxDatatableModule,
    RouterModule.forChild(MerchantRoutes),
    NgxDaterangepickerMd.forRoot()
  ]
})
export class MerchantModule { }

