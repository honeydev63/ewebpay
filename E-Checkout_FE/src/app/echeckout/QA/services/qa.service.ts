import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class QAService {
  baseUrl = AppSettings.API_ENDPOINT;
  baseUser =  'qa/';

  constructor(private http: HttpClient) { }
  getQAListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl  + this.baseUser + 'agent/listing' + queryStr);
  }
  getQaOrderListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl  + this.baseUser + 'order/listing' + queryStr);
  }
  getSuspiciousOrderListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl   +  this.baseUser + 'marked/order/listing/' + queryStr);
  }
  getResolvedOrderListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl   +  this.baseUser + 'agent/resolved/order/listing/' + queryStr);
  }
  deleteQA(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl  + this.baseUser + 'agent/delete/' + queryStr);
  }
  resetQaPassword(data: any) {
    return this.http.post<any>(this.baseUrl  + this.baseUser + 'agent/password/reset/', data);
  }
  getAgentDataById(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl  + this.baseUser + 'agent/detail/' + queryStr);
  }
  getQaOrderDataById(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl  + this.baseUser + 'order/detail/' + queryStr);
  }
  editQaAgentData(data: any) {
    return this.http.post<any>(this.baseUrl + this.baseUser +  'agent/edit/', data);
   }
  saveAgentData(data: any) {
    return this.http.post<any>(this.baseUrl  + this.baseUser + 'agent/add/', data);
  }
  changeStatus(data: any) {
    return this.http.post<any>(this.baseUrl + this.baseUser + 'order/status/' , data);
  }
}
