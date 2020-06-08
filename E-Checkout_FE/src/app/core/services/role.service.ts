import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor() {}
  getUserRole() {
    const tempData = JSON.parse(localStorage.getItem('userData'));
    return tempData.user_role;
  }
}
