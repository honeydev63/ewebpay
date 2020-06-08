import { Injectable } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private storageService: StorageService) {
    }

  public getToken(): string {
    const data = this.storageService.getData('userData');
    return data.token;
  }
}
