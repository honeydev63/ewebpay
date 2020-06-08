import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router,
              private storageService: StorageService,
              private toastrService: EpharmaToasterService) { }
              isUserLogin: boolean;
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const userData = this.storageService.getData('userData');
    this.isUserLogin = !!userData && !!userData.is_user_login ? userData.is_user_login : false;
    if (this.isUserLogin === true) {
      return true;
    }

    this.toastrService.showError('Error', 'Your session has expired please login again');
    this.router.navigateByUrl('/');
    return false;
  }
}
