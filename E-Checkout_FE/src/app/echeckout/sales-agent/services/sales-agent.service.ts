import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class SalesAgentService {
  baseUrl = AppSettings.API_ENDPOINT;
  constructor(private http: HttpClient) { }
  // Method: declaring api to fetch details for customer's list
  getSalesAgentListingData(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'agent/listing' + queryStr);
  }
  deleteAgent(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl + 'agent/delete/' + queryStr);
  }
  getAgentDataById(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + 'agent/detail/' + queryStr);
  }
  editSalesAgentData(data: any) {
    return this.http.post<any>(this.baseUrl + 'agent/edit/', data);
   }
  saveAgentData(data: any) {
    return this.http.post<any>(this.baseUrl + 'agent/add/', data);
  }
  resetAgentPassword(data: any) {
    return this.http.post<any>(this.baseUrl + 'agent/password/reset/', data);
  }
  getAllIncentiveModels() {
    return this.http.get<any>(this.baseUrl + 'incentive/all/detail/');
  }
  assignIncentiveToAgent(data: any) {
    return this.http.post<any>(this.baseUrl + 'incentive/agent/mapping/', data);
  }
  removeIncentiveToAgent(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
      queryStr = '';
    }
    return this.http.delete<any>(this.baseUrl + 'incentive/agent/delete/' + queryStr);
  }
}
// End of code
