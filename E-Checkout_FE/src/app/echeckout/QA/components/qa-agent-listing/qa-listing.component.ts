import { Component, OnInit } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { QAService } from '../../services/qa.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-qa-listing',
  templateUrl: './qa-listing.component.html',
  styleUrls: ['./qa-listing.component.scss']
})
export class QaListingComponent implements OnInit {
  display = 'none';
  responseCode = ResponseCode;
  SelectionType = SelectionType;
  enableSummary = true;
  summaryPosition = 'top';
  pages: any;
  rows: any;
  selected = [];
  ColumnMode = ColumnMode;
  sub: any;
  searchField: FormControl;
  searchForm: FormGroup;
  filterObj = {
    search: '',
    perPage: 50,
    currentPage: 1,
  };
  LIMITS = [
    { name: '10', id: 10 },
    { name: '25', id: 25 },
    { name: '50', id: 50 },
    { name: '100', id: 100 }
  ];
  limit: number = this.filterObj.perPage;
  rowLimits: Array<any> = this.LIMITS;
  constructor(private qaService: QAService ,
              private fb: FormBuilder,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private auth: AuthService,
              private toastrService: EpharmaToasterService,
              private router: Router) {
                this.searchField = new FormControl();
                this.searchForm = fb.group({search: this.searchField});
                this.searchField.valueChanges
                  .debounceTime(400)
                  .switchMap(term => of(term)).subscribe(result => {
                    this.filterObj.search = result;
                    this.navigateUser();
                  });
              }

  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.filterObj.search = params.search || '';
      this.filterObj.currentPage = params.currentPage || '';
      this.filterObj.perPage = params.perPage || '';
      this.getQAListingData();
    });
  }
 // End of above code
 changeRowLimits(event) {
  this.filterObj.perPage = event.id;
  this.filterObj.currentPage = 1;
  this.navigateUser();
}
// Method:to fetch items from BE for customer's list
getQAListingData() {
  this.router.events.subscribe((evt) => {
    if (!(evt instanceof NavigationEnd)) {
        return;
    }
    window.scrollTo(0, 0);
  });
  const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
  this.qaService.getQAListingData(tempUrlQuery).subscribe(
    response => {
      if (!!response && !!response.data && response.data.length !== 0) {
        this.rows = response.data;
        this.pages = response.meta;
      } else {
        this.rows = [];
        this.pages = {};
      }
    },
    err => console.error(err)
    // display error
  );
}
// End of above code
// Method: Used to Navigate user to the view Component when user click on the View Agent
viewAgent(data) {
  if (!!data.agent_id && data.agent_id !== '') {
    // tslint:disable-next-line: max-line-length
    this.router.navigate(['/qa/view-agent'], { queryParams: { id: data.agent_id}, queryParamsHandling: 'merge' });
  } else {
    this.toastrService.showError('Error', 'Something went wrong please try again later');
  }
}
// End of the Above code
// Method: Used to Navigate user to the Edit Component when user click on the Edit Agent
editAgent(data) {
  if (!!data.agent_id && data.agent_id !== '') {
    // tslint:disable-next-line: max-line-length
    this.router.navigate(['/qa/ae-qaagent'], { queryParams: { type: 'edit', id: data.agent_id}, queryParamsHandling: 'merge' });
  } else {
    this.toastrService.showError('Error', 'Something went wrong please try again later');
  }
}
// End of the Above code
// Method: When user tries to delete product from the Product listing of the Agent
deleteAgent(data) {
  const isConfirmDelete = confirm('Do you seriously want to delete ' + data.agent_name + ' ( Agent ID: ' + data.agent_id + ' ) ?');
  if (isConfirmDelete === true) {
    const queryObj = {
      agent_id: data.agent_id
    };
    const agentQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.qaService.deleteQA(agentQueryStr).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_user_deleted === true) {
            this.toastrService.showSuccess('Success', response.data.message);
            this.getQAListingData();
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something Went Wrong, Please Try Again Later !!!');
        }
      },
      err => console.error(err)
    );
  }
}
// End of the above code
// Method: When user tries to delete product from the Product listing of the Agent
resetAgentPassword(data) {
  // tslint:disable-next-line: max-line-length
  const isConfirmDelete = confirm('Do you seriously want to Reset Password for ' + data.agent_name + ' ( Agent ID: ' + data.agent_id + ' ) ?');
  if (isConfirmDelete === true) {
    const queryObj = {
      agent_id: data.agent_id
    };
    this.qaService.resetQaPassword(queryObj).subscribe(
      response => {
        if (!!response && !!response.data) {
          if (response.data.is_password_updated === true) {
            // tslint:disable-next-line: max-line-length
            alert('This Password is Visible only for one time. Please note it down or reset again to see new password. New Password is : ' + response.data.new_password);
          } else {
            this.toastrService.showError('Error', response.data.message);
          }
        } else {
          this.toastrService.showError('Error', 'Something Went Wrong, Please Try Again Later !!!');
        }
      },
      err => console.error(err)
    );
  }
}
// End of the above code
// Method: is used to Navigate user to a desired filter Page
navigateUser() {
  const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
  const tempLink = '/qa?' + tempUrlQuery;
  this.router.navigateByUrl(tempLink);
}
// End of the Above Code
// Method : to set pagination for list items
setPage(event) {
  this.filterObj.currentPage = event.offset + 1;
  this.navigateUser();
}
}
