import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {AppSettings} from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  baseUrl = AppSettings.API_ENDPOINT;
  baseUser =  'work/';

  constructor(private http: HttpClient) { }
  getWorkOrderList(queryStr: string) {
    if (!!queryStr) {
      queryStr = '?' + queryStr;
    } else {
        queryStr = '';
    }
    return this.http.get<any>(this.baseUrl + this.baseUser + 'order/listing/' + queryStr);
  }
Resend(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'order/resend/' , data);
}
ResendDocusign(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'order/resend_docusign/' , data);
}
changeStatus(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'order/status/change/' , data);
}
deleteWorkOrder(data: any) {
  return this.http.post<any>(this.baseUrl + this.baseUser + 'order/remove/' , data);
}

}
