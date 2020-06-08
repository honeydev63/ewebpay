import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpErrorResponse, HttpEventType} from '@angular/common/http';

import { AppSettings } from 'src/app/core/app-settings';
import { AuthService } from 'src/app/core/auth/auth.service';
@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  baseUrl = AppSettings.API_ENDPOINT;
  constructor(private http: HttpClient,
              public auth: AuthService) { }
  getProductData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'product/listing' + queryStr);
  }
  saveProductData(data: any) {
  return this.http.post<any>(this.baseUrl + 'product/add/' , data);
  }
//   ImportData(formData: any) {
//     return this.http.post<any>(this.baseUrl + this.baseUser + 'products/import/' , formData);
//   }
  getFilterDropdown() {
    return this.http.get<any>(this.baseUrl + 'getbrandsandcategory/');
 }
 editProductData(data: any) {
  return this.http.post<any>(this.baseUrl + 'product/edit/', data);
 }
 deleteProduct(queryStr: string) {
  if (!!queryStr) {
    queryStr = '?' + queryStr;
} else {
    queryStr = '';
}
  return this.http.delete<any>(this.baseUrl + 'product/delete/' + queryStr);
}
  getProductDataById(queryStr: string) {
    if (!!queryStr) {
        queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'product/detail/' + queryStr);
}
// getSalesHistoryDataById(queryStr: string) {
//   if (!!queryStr) {
//       queryStr = '?' + queryStr;
//   } else {
//       queryStr = '';
//   }
//   return this.http.get<any>(this.baseUrl  + this.baseUser + 'products/saleshistory' + queryStr);
// }
// getPurchaseHistoryDataById(queryStr: string) {
//   if (!!queryStr) {
//       queryStr = '?' + queryStr;
//   } else {
//       queryStr = '';
//   }
//   return this.http.get<any>(this.baseUrl  + this.baseUser + 'products/purchasehistory' + queryStr);
// }
}
// End of code

