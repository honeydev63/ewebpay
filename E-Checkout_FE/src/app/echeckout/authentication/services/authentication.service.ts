import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppSettings } from 'src/app/core/app-settings';
@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
    baseUrl = AppSettings.API_ENDPOINT;
    constructor(private http: HttpClient) {
    }
    loginUser(data: any) {
        return this.http.post<any>(this.baseUrl + 'login/' , data);
    }
}
