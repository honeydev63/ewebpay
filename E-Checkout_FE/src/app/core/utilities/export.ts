import { AuthService } from 'src/app/core/auth/auth.service';
import { AppSettings } from 'src/app/core/app-settings';
import { Injectable } from '@angular/core';
import { EpharmaToasterService } from '../services/toaster.service';
import * as moment from 'moment';
@Injectable({
    providedIn: 'root'
})
export class ExportFile {
    baseUrl = AppSettings.API_ENDPOINT;
    mainUrl = '';
    moduleStr = '';
    constructor(
        public auth: AuthService,
        private toastrService: EpharmaToasterService
        ) {

    }
    getExportData(moduleName: string, queryStr?: string) {
        this.moduleStr = moduleName;
        if (!!queryStr) {
            queryStr = '?' + queryStr;
        } else {
            queryStr = '';
        }
        if (this.moduleStr === 'customers') {
            this.mainUrl = this.baseUrl + 'customer/export/' + queryStr;
        } else if (this.moduleStr === 'sales-order') {
            this.mainUrl = this.baseUrl + 'orders/export/' + queryStr;
        } else if (this.moduleStr === 'product') {
            this.mainUrl = this.baseUrl + 'product/export/' + queryStr;
        } else if (this.moduleStr === 'sales-agent') {
            this.mainUrl = this.baseUrl + 'agent/export/' + queryStr;
        }
        const token = 'Bearer ' + this.auth.getToken();
        const request =  new XMLHttpRequest();
        const toaster = this.toastrService;
        request.open('GET', this.mainUrl);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.responseType = 'blob';
        request.setRequestHeader('Authorization',  token);
        request.onload = function(e) {
            if (request.status === 200) {
                const contentTypeHeader = request.getResponseHeader('Content-Type');
                const file = new Blob([this.response] , {type: contentTypeHeader});
                const url = window.URL.createObjectURL(file);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.href = url;
                a.download = moduleName + '_' + moment().format('DD-MM-YYYY_HH:mm') + '.xls';
                a.click();
            } else {
                toaster.showError('Error', 'Something went wrong, Please try after sometime !!!');
            }
            };
        request.send();
      }
}
