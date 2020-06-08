import { Component, OnInit } from '@angular/core';
import { NgForm, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from 'src/app/echeckout/authentication/services/authentication.service';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserRole } from 'src/app/core/dictionary/user-role';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userRole = UserRole;
  isLoginFormValidate = false;
  loginForm: FormGroup;
  loginObj: any;
  responseloginObj: any;
  loginButtonDisable = false;
  constructor(
    private authenticationService: AuthenticationService,
    private toastrService: EpharmaToasterService,
    private formBuilder: FormBuilder,
    private router: Router,
    private storageService: StorageService,
    ) {
      if (this.storageService.getData('rememberData') !== null) {
        const loginData = this.storageService.getData('rememberData');
        this.loginForm = this.formBuilder.group({
          user_input: [loginData.user_input, [Validators.required, Validators.email]],
          password: [loginData.password, [Validators.required]],
          isRemember: [loginData.isRemember]
        });
      } else {
        this.loginForm = this.formBuilder.group({
          user_input: ['', [Validators.required, Validators.email]],
          password: ['', [Validators.required]],
          isRemember: [null]
        });
      }
    }
  // Method calls and formgroup declaration
  ngOnInit() { }
  // End of above code
  // Method : for sending login details to BE
  loginUser(data: any) {
    if (data.valid === true) {
      this.loginButtonDisable = true;
      this.isLoginFormValidate = false;
      this.authenticationService.loginUser(data.value).subscribe(
        response => {
          this.loginButtonDisable = false;
          this.responseloginObj = response.data;
          if (!!response && !!response.data && response.data.isUserLogin === true ) {
              if (data.value.isRemember === true) {
                this.storageService.setData('rememberData', data.value);
              }
              this.toastrService.showSuccess('Success', 'Login Successfull !!!');
              response.data.userData.is_user_login = response.data.isUserLogin;
              this.storageService.setData('userData', response.data.userData);
              if (this.userRole.agent === response.data.userData.user_role) {
                this.router.navigate(['/sales-orders'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
              } else if ( this.userRole.qa === response.data.userData.user_role) {
                this.router.navigate(['/qa/orders-listing'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
              } else {
                this.router.navigate(['/products'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
              }
            } else {
              this.toastrService.showError('Wrong credentials', response.data.userData.message);
            }
        },
        err => {
          this.loginButtonDisable = false;
          console.error(err);
        }
      );
    } else {
      this.isLoginFormValidate = true;
      this.toastrService.showError('Error', 'Validation Error, Please Check your form');
    }
  }
  // End of above code
}
