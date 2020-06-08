import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class SalesOrdersService {
  baseUrl = AppSettings.API_ENDPOINT;
  baseUser =  'orders/';

  constructor(private http: HttpClient) { }
  saveBankCheckoutData(data: any) {
    return this.http.post<any>(this.baseUrl + 'order/checkout/bank/' , data);
  }
  saveCardCheckoutData(data: any) {
    return this.http.post<any>(this.baseUrl + 'order/checkout/card/' , data);
  }
  saveLinkCheckoutData(data: any) {
    return this.http.post<any>(this.baseUrl + 'order/create/' , data);
  }
  saveProductData(data: any) {
    return this.http.post<any>(this.baseUrl +  'order/product/price/calculation/' , data);
  }
  getSalesOrderList(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'order/listing/'  + queryStr);
  }
  getOrderViewDataByID(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
  } else {
      queryStr = '';
  }
    return this.http.get<any>(this.baseUrl + 'order/detail/' + queryStr);
  }
  getSuspiciousOrderViewDataByID(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
  } else {
      queryStr = '';
  }
    return this.http.get<any>(this.baseUrl + 'agent/order/detail/' + queryStr);
  }
  getCustomer() {
    return this.http.get<any>(this.baseUrl + 'customer/all/detail/');
  }
  getSalesFilterDropdownData() {
    return this.http.get<any>(this.baseUrl + this.baseUser + 'getallstatuses/');
  }
  getProductDropdown() {
    return this.http.get<any>(this.baseUrl + 'product/all/detail/');
  }
getSalesExportData() {
  return window.open((this.baseUrl + this.baseUser + 'sold-order/export'));
}
salesOrderImportData(formData: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'sold-order/import/' , formData);
}
getOrderDataById(queryStr: string) {
  if (!!queryStr) {
    queryStr = '?' + queryStr;
} else {
    queryStr = '';
}
  return this.http.get<any>(this.baseUrl + this.baseUser + 'sold-orders/edit/info/' + queryStr);
}
addCustomer(data: any) {
  return this.http.post<any>(this.baseUrl + 'customers/', data);
}
getAllProduct() {
  return this.http.get<any>(this.baseUrl + 'inventory/getallproducts/');
}
getProductDataById(queryStr: string) {
  if (!!queryStr) {
    queryStr = '?' + queryStr;
} else {
    queryStr = '';
}
  return this.http.get<any>(this.baseUrl + 'customers/info/' + queryStr);
}
getTotalAmount(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'total-amount/', data);
}
generateBill(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'add/', data);
}
verify(data: any) {
  return this.http.post<any>(this.baseUrl + 'order/verification/', data);
}
resendOtp(data: any) {
  return this.http.post<any>(this.baseUrl + 'order/otp/resend/', data);
}
changeStatus(data: any) {
  return this.http.post<any>(this.baseUrl +  'agent/order/status/' , data);
}
getSuspiciousOrderListingData(queryStr: string) {
  if (!!queryStr) {
    queryStr = '?' + queryStr;
  } else {
    queryStr = '';
  }
  return this.http.get<any>(this.baseUrl  + 'agent/mark/order/listing/' + queryStr);
}
generateEditBill(data: any, queryStr: string) {
  if (!!queryStr) {
      queryStr = '?' + queryStr;
  } else {
      queryStr = '';
  }
  return this.http.put<any>(this.baseUrl + this.baseUser +  'edit/' + queryStr, data);
}
}
