import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ForgotPassowdComponent } from './components/forgot-passowd/forgot-passowd.component';
import { SharedModule } from 'src/app/shared/shared.module';
const AuthenticationRoutes: Routes = [
  { path: '', component: LoginComponent},
  { path: 'forgot-password', component: ForgotPassowdComponent},
];

@NgModule({
  declarations: [
    LoginComponent,
    ForgotPassowdComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(AuthenticationRoutes)
  ]
})
export class AuthenticationModule { }
