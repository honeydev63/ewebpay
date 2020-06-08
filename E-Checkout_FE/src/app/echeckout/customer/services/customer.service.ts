import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  baseUrl = AppSettings.API_ENDPOINT;
  baseUser =  'orders/';

  constructor(private http: HttpClient) { }
   // End of above code
  // Method:to fetch details for customer in  customer's list
  getCustomerList(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'customer/listing/' + queryStr);
  }
   // End of above code
  // Method:to delete customer  in  customer's list
  deleteCustomer(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl + 'customer/delete/' + queryStr);
  }
   // End of above code
  // Method:to fetch details for specific customer in  customer's list
  getCustomerDataByID(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
  } else {
      queryStr = '';
  }
    return this.http.get<any>(this.baseUrl + 'customer/detail/' + queryStr);
  }
getCustomer() {
  return this.http.get<any>(this.baseUrl + 'customers/getallcustomers/');
}
addCustomer(data: any) {
  return this.http.post<any>(this.baseUrl + 'customers/', data);
}
 // End of above code
  // Method:to edit details for customer in  customer's list
editCustomerData(data: any) {
  return this.http.post<any>(this.baseUrl + 'customer/edit/', data);
}
createCustomerOtpSent(data: any) {
  return this.http.post<any>(this.baseUrl + 'customer/add/', data);
}
createCustomerVerifySent(data: any) {
  return this.http.post<any>(this.baseUrl + 'customer/add/verify/', data);
}
resendOtp(data: any) {
  return this.http.post<any>(this.baseUrl + 'customer/add/resend/', data);
}
// createProductData(data: any) {
//   return this.http.post<any>(this.baseUrl + 'customer/create/', data);
// }
}
