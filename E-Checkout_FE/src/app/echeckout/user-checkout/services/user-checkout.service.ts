import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class UserCheckoutService {
  baseUrl = AppSettings.API_ENDPOINT;
  baseUser =  'order/';

  constructor(private http: HttpClient) { }
  getUserDetails(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + this.baseUser + 'checkout/detail/' + queryStr);
  }
saveUserCheckoutData(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'checkout/process/' , data);
}
globalsearch(queryStr: string) {
  if (!!queryStr) {
      queryStr = '?query=' + queryStr;
  } else {
      queryStr = '';
  }
  return this.http.get<any>(this.baseUrl + 'maps/address/autocomplete/' + queryStr);
}
}
