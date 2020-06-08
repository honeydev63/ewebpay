import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResponseCode } from 'src/app/core/dictionary/response-code';
import { SelectionType, ColumnMode } from '@swimlane/ngx-datatable';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IncentiveService } from '../../services/incentive.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
// tslint:disable-next-line: import-blacklist
import 'rxjs/Rx';
import { of, from } from 'rxjs';
import { ExportFile } from 'src/app/core/utilities/export';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-incentive-listing',
  templateUrl: './incentive-listing.component.html',
  styleUrls: ['./incentive-listing.component.scss']
})
export class IncentiveListingComponent implements OnInit {
  @ViewChild('closeAgentAssignModal', null) closeAgentAssignModal: ElementRef;
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
  assignAgentForm: FormGroup;
  checkAssignAgentFormValidation = false;
  agentList: any = [];
  selectedAgent: any;
  constructor( private incentiveService: IncentiveService ,
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
      this.getIncentiveListingData();
      this.getAllAgent();
    });
  }
  // End of above code
  changeRowLimits(event) {
    this.filterObj.perPage = event.id;
    this.filterObj.currentPage = 1;
    this.navigateUser();
  }
  // Method:to fetch items from BE for customer's list
  getIncentiveListingData() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0);
    });
    const tempUrlQuery = EpharmaUtilities.generateQueryString(this.filterObj);
    this.incentiveService.getIncentiveListingData(tempUrlQuery).subscribe(
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
  // Method: Used to Navigate user to the view Component when user click on the View Incentive
  viewIncentive(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/incentives/view-incentive'], { queryParams: { id: data.id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
  // End of the Above code
  // Method: Used to Navigate user to the Edit Component when user click on the Edit Incentive
  editIncentive(data) {
    if (!!data.id && data.id !== '') {
      // tslint:disable-next-line: max-line-length
      this.router.navigate(['/incentives/incentive'], { queryParams: { type: 'edit', id: data.id}, queryParamsHandling: 'merge' });
    } else {
      this.toastrService.showError('Error', 'Something went wrong please try again later');
    }
  }
  // End of the Above code
  // Method: When user tries to delete product from the Product listing of the Agent
  deleteIncentive(data) {
    const isConfirmDelete = confirm('Do you seriously want to delete ' + data.name + ' ( Incentive Model ID: ' + data.id + ' ) ?');
    if (isConfirmDelete === true) {
      const queryObj = {
        incentive_id: data.id
      };
      const incentiveQueryStr = EpharmaUtilities.generateQueryString(queryObj);
      this.incentiveService.deleteIncentiveModel(incentiveQueryStr).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_incentive_deleted === true) {
              this.toastrService.showSuccess('Success', response.data.message);
              this.getIncentiveListingData();
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
  // Method: used to Assign Agent
  assignAgent(data) {
    console.log('The Data in the Assign Agent Data ', data);
    this.selectedAgent = data;
    this.assignAgentForm = this.formBuilder.group({
      agent_id : [null, Validators.required],
    });
  }
  // end of the above code
  // Method: used to fetch all the Agent
  getAllAgent() {
    this.incentiveService.getAllAgentData().subscribe(
      response => {
        if (!!response && !!response.data && response.data.agent.length !== 0) {
          // tslint:disable-next-line: prefer-for-of
          for (let i = 0; i < response.data.agent.length; i++) {
            this.agentList.push({
              id: response.data.agent[i].agent_id,
              // tslint:disable-next-line: max-line-length
              name: response.data.agent[i].agent_name
            });
          }
        } else {
          this.agentList = [];
        }
      },
      err => console.error(err)
      // display error
    );
  }
  // End Of the above code
  // Method: used for Assign Agent SAVE
  saveAgentAssign(data) {
    if (data.valid === true) {
      this.checkAssignAgentFormValidation = false;
      const queryObj = {
        agent_id: data.value.agent_id,
        incentive_id: this.selectedAgent.id
      };
      this.incentiveService.assignAgent(queryObj).subscribe(
        response => {
          if (!!response && !!response.data) {
            if (response.data.is_incentive_mapped === true) {
              this.selectedAgent = null;
              this.toastrService.showSuccess('Success', response.data.message);
              this.getIncentiveListingData();
              this.closeAgentAssignModal.nativeElement.click();
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
      this.checkAssignAgentFormValidation = true;
      this.toastrService.showError('Error', 'Please select Agent First !!!');
    }
  }
  // End of the above code
}
