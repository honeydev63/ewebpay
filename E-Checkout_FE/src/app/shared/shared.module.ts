import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'angular-highcharts';
import { HttpClientModule } from '@angular/common/http';
import { LayoutsModule } from 'src/app/layouts/layouts.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { DpDatePickerModule } from 'ng2-date-picker';
import { NgSelectModule } from '@ng-select/ng-select';
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LayoutsModule,
    AngularFontAwesomeModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    DpDatePickerModule
  ],
  exports: [
    CommonModule,
    LayoutsModule,
    HttpClientModule,
    AngularFontAwesomeModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    DpDatePickerModule
  ]
})
export class SharedModule { }
