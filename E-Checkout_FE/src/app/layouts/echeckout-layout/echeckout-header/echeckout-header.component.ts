import { Component, OnInit } from '@angular/core';
import { EcheckoutLayoutService } from '../echeckout-layout-service/echeckout-layout.service';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-echeckout-header',
  templateUrl: './echeckout-header.component.html',
  styleUrls: ['./echeckout-header.component.scss']
})
export class EcheckoutHeaderComponent implements OnInit {
  constructor( private  echeckoutLayoutService: EcheckoutLayoutService,
               private toastrService: EpharmaToasterService,
               private router: Router,
               private storageService: StorageService ) {
      }
  // Method: implementing Oninit
  ngOnInit() {
  }
  // END
  // Method: Used when user click on the Logout
  logoutUser() {
    this.echeckoutLayoutService.logoutUser().subscribe(
      response => {
        if (!!response && !!response.data && response.data.is_user_logout === true) {
          this.storageService.removeData('userData');
          this.toastrService.showSuccess('Success', response.data.message);
          this.router.navigateByUrl('/');
        } else {
          this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
        }
      },
      err => console.error(err)
      // display error
    );
  }
  // End of the above code
}
