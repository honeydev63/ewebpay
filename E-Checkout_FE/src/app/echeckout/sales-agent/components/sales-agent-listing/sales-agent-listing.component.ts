import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SalesAgentService } from '../../services/sales-agent.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { ExportFile } from 'src/app/core/utilities/export';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-sales-agent-listing',
  templateUrl: './sales-agent-listing.component.html',
  styleUrls: ['./sales-agent-listing.component.scss']
})
export class SalesAgentListingComponent implements OnInit {
  @ViewChild('closeIncentiveAssignModal', null) closeIncentiveAssignModal: ElementRef;
  @ViewChild('closeIncentiveRemoveModal', null) closeIncentiveRemoveModal: ElementRef;
  exportFileEntity = new ExportFile(this.auth, this.toastrService);
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
  assignAgentData: any;
  assignIncentiveForm: FormGroup;
  checkAssignIncentiveFormValidation = false;
  removeIncentiveForm: FormGroup;
  checkRemoveIncentiveFormValidation = false;
  incentiveList: any = [];
  assignedIncentiveListData: any = [];
  constructor( private salesAgentService: SalesAgentService ,
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
  // Method: calling method for fetching items  from BE
  ngOnInit() {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      this.filterObj.search = params.search || '';
      this.filterObj.currentPage = params.currentPage || '';
      this.filterObj.perPage = params.perPage || '';
      this.getSalesAgentListingData();
      this.getAllIncentiveModels();
    });
  }
  // End of above code
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
  // Method:to fetch items from BE for customer's list
  getSalesAgentListingData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.salesAgentService.getSalesAgentListingData(tempUrlQuery).subscribe(
      response => {
        if (!!response && !!response.data) {
          this.rows = response.data;
          this.pages = response.meta;
          this.pages.currentPage = response.meta.currentPage - 1;
        } else {
          this.toastrService.showError('Error', 'Something went wrong, Please try again later !!!');
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
      this.router.navigate(['/sales-agent/view-sales-agent'], { queryParams: { id: data.agent_id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
  // End of the Above code
  // Method: Used to Navigate user to the Edit Component when user click on the Edit Agent
  editSalesAgent(data) {
    if (!!data.agent_id && data.agent_id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/sales-agent/agent'], { queryParams: { type: 'edit', id: data.agent_id}, queryParamsHandling: 'merge' });
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
      this.salesAgentService.deleteAgent(agentQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_user_deleted === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getSalesAgentListingData();
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
      this.salesAgentService.resetAgentPassword(queryObj).subscribe(
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
    const tempLink = '/sales-agent?' + tempUrlQuery;
    this.router.navigateByUrl(tempLink);
  }
  // End of the Above Code
  // Method : to set pagination for list items
  setPage(event) {
    this.filterObj.currentPage = event.offset + 1;
    this.navigateUser();
  }
  // End of the Above code
  // Method: used to export the data
  exportFile() {
    this.exportFileEntity.getExportData('sales-agent', '');
  }
  // End of the above code
  // Method: Which is used to open the Incentive Model
  openIncentiveModel(data: any) {
    this.assignAgentData = data;
    this.assignIncentiveForm = this.formBuilder.group({
      incentive_id : [null, Validators.required],
    });
  }
  // End of the above code
  // Method used to get All Incentive Models
  getAllIncentiveModels() {
    this.salesAgentService.getAllIncentiveModels().subscribe(
      response => {
        if (!!response && !!response.data && response.data.incentive.length !== 0) {
          // tslint:disable-next-line: prefer-for-of
          for (let i = 0; i < response.data.incentive.length; i++) {
            this.incentiveList.push({
              id: response.data.incentive[i].id,
              // tslint:disable-next-line: max-line-length
              name: response.data.incentive[i].name + ' ,type: ' + response.data.incentive[i].type + ' ,amount: ' + response.data.incentive[i].target_amount
            });
          }
        } else {
          this.incentiveList = [];
        }
      },
      err => console.error(err)
      // display error
    );
  }
  // End of the above code
  // Method used to assign the Incentive Model to Agent
  saveIncentiveAssign(data) {
    if (data.valid === true) {
      this.checkAssignIncentiveFormValidation = false;
      const queryObj = {
        agent_id: this.assignAgentData.agent_id,
        incentive_id: data.value.incentive_id
      };
      this.salesAgentService.assignIncentiveToAgent(queryObj).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_incentive_mapped === true) {
              this.assignAgentData = null;
              this.toastrService.showSuccess('Success', response.data.message);
              this.getSalesAgentListingData();
              this.closeIncentiveAssignModal.nativeElement.click();
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
          } else {
            this.toastrService.showError('Error', 'Something Went Wrong, Please Try Again Later !!!');
          }
        },
        err => console.error(err)
      );
    } else {
      this.checkAssignIncentiveFormValidation = true;
      this.toastrService.showError('Error', 'Please select Incentive Model First !!!');
    }
  }
  // End of the above code
  // Methd Which is used to Open the Remove Incentive Model
  openRemoveIncentiveModel(data: any) {
    this.assignedIncentiveListData = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < data.incentive_data.length; i++) {
      this.assignedIncentiveListData.push({
        id: data.incentive_data[i].id,
        // tslint:disable-next-line: max-line-length
        name: data.incentive_data[i].incentive.name + ' ,type: ' + data.incentive_data[i].incentive.type + ' ,amount: ' + data.incentive_data[i].incentive.target_amount
      });
    }
    console.log('The Assigned Incentive List is ', this.assignedIncentiveListData);
    this.assignAgentData = data;
    this.removeIncentiveForm = this.formBuilder.group({
      incentive_id : [null, Validators.required],
    });
  }
  // End of the above code
  // Method used to assign the Incentive Model to Agent
  saveRemoveIncentiveModel(data) {
    if (data.valid === true) {
      this.checkRemoveIncentiveFormValidation = false;
      const queryObj = {
        incentive_agent_id: data.value.incentive_id
      };
      const incentiveRemoveQueryStr = EpharmaUtilities.generateQueryString(queryObj);
      this.salesAgentService.removeIncentiveToAgent(incentiveRemoveQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_incentive_agent_deleted === true) {
              this.assignAgentData = null;
              this.toastrService.showSuccess('Success', response.data.message);
              this.getSalesAgentListingData();
              this.closeIncentiveRemoveModal.nativeElement.click();
            } else {
              this.toastrService.showError('Error', response.data.message);
            }
          } else {
            this.toastrService.showError('Error', 'Something Went Wrong, Please Try Again Later !!!');
          }
        },
        err => console.error(err)
      );
    } else {
      this.checkRemoveIncentiveFormValidation = true;
      this.toastrService.showError('Error', 'Please select Incentive Model FIrst !!!');
    }
  }
  // End of the above code
}
