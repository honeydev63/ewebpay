import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { StorageService } from 'src/app/core/services/storage.service';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { EpharmaToasterService } from '../services/toaster.service';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    token = '';
  constructor(private storageService: StorageService,
              public auth: AuthService,
              public router: Router,
              private toastrService: EpharmaToasterService) {
  }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const data = this.storageService.getData('userData');
    if ( !!data && !!data.token && data.token !== '') {
      request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${this.auth.getToken()}`
          }
      });
    }
    return next.handle(request).pipe( tap(() => {},
      (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status !== 401) {
          if (err.status === 403 ) {
            this.toastrService.showError('Authentication Error', 'You do not have permission to perform this action.');
          }
          return;
        }
        this.storageService.removeData('userData');
        this.toastrService.showError('Error', 'Your session has expired please login again');
        this.router.navigate(['/authentication']);
      }
    }));
  }
}
