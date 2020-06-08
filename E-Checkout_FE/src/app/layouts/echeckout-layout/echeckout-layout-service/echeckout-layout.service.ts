import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from 'src/app/core/app-settings';

@Injectable({
  providedIn: 'root',
})
export class EcheckoutLayoutService {
    baseUrl = AppSettings.API_ENDPOINT;
    constructor(private http: HttpClient) {
    }
    logoutUser() {
      return this.http.get<any>(this.baseUrl + 'logout/');
    }
}
