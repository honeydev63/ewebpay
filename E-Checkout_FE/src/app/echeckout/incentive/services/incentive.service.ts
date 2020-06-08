import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class IncentiveService {
  baseUrl = AppSettings.API_ENDPOINT;
  constructor(private http: HttpClient) { }
  // Method: declaring api to fetch details for customer's list
  getIncentiveListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'incentive/listing' + queryStr);
  }
  saveIncentiveData(data: any) {
    return this.http.post<any>(this.baseUrl + 'incentive/create/', data);
  }
  getIncentiveDataById(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'incentive/detail/' + queryStr);
  }
  editIncentiveData(data: any) {
    return this.http.post<any>(this.baseUrl + 'incentive/edit/', data);
  }
  deleteIncentiveModel(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl + 'incentive/delete/' + queryStr);
  }
  getAllAgentData() {
    return this.http.get<any>(this.baseUrl + 'agent/all/detail/');
  }
  assignAgent(data: any) {
    return this.http.post<any>(this.baseUrl + 'incentive/agent/mapping/', data);
  }
}
// End of code
