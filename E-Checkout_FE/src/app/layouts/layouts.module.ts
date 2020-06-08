import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EcheckoutHeaderComponent } from 'src/app/layouts/echeckout-layout/echeckout-header/echeckout-header.component';
import { EcheckoutFooterComponent } from 'src/app/layouts/echeckout-layout/echeckout-footer/echeckout-footer.component';
import { EcheckoutSubHeaderComponent } from 'src/app/layouts/echeckout-layout/echeckout-sub-header/echeckout-sub-header.component';
import { EcheckoutLayoutComponent } from 'src/app/layouts/echeckout-layout/echeckout-layout.component';
import { EcheckoutSidebarComponent } from './echeckout-layout/echeckout-sidebar/echeckout-sidebar.component';


@NgModule({
  declarations: [
    EcheckoutHeaderComponent,
    EcheckoutFooterComponent,
    EcheckoutSubHeaderComponent,
    EcheckoutLayoutComponent,
    EcheckoutSidebarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ]
})
export class LayoutsModule { }
