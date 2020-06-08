import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class MerchantService {
  baseUrl = AppSettings.API_ENDPOINT + 'merchant/';

  constructor(private http: HttpClient) { }
   // End of above code
  // Method:to fetch details for merchant in  merchant's list
  getMerchantList(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'listing/' + queryStr);
  }
   // End of above code
  // Method:to delete merchant  in  merchant's list
  deleteMerchant(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl + 'delete/' + queryStr);
  }
   // End of above code
  // Method:to fetch details for specific merchant in  merchant's list
  getMerchantDataByID(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'detail/' + queryStr);
  }
  getMerchant() {
    return this.http.get<any>(this.baseUrl + 'getallmerchants/');
  }
  addMerchant(data: any) {
    return this.http.post<any>(this.baseUrl, data);
  }
  // End of above code
    // Method:to edit details for merchant in  merchant's list
  editMerchantData(data: any) {
    return this.http.post<any>(this.baseUrl + 'edit/', data);
  }
  createMerchantOtpSent(data: any) {
    return this.http.post<any>(this.baseUrl + 'add/', data);
  }
  createMerchantVerifySent(data: any) {
    return this.http.post<any>(this.baseUrl + 'add/verify/', data);
  }
  resendOtp(data: any) {
    return this.http.post<any>(this.baseUrl + 'add/resend/', data);
  }
  // createProductData(data: any) {
  //   return this.http.post<any>(this.baseUrl + 'create/', data);
  // }
}
