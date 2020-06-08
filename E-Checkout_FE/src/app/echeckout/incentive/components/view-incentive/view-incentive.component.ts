import { Component, OnInit } from '@angular/core';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { FormBuilder } from '@angular/forms';
import { IncentiveService } from '../../services/incentive.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';

@Component({
  selector: 'app-incentive-agent',
  templateUrl: './view-incentive.component.html',
  styleUrls: ['./view-incentive.component.scss']
})
export class ViewIncentiveComponent implements OnInit {
  sub: any;
  agentId: number;
  incentiveData: any;
  constructor(
    private formBuilder: FormBuilder,
    private incentiveService: IncentiveService ,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
  ) {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.agentId = params.id;
      this.getIncentiveData(this.agentId);
      }
    });
   }

  ngOnInit() {
  }
  getIncentiveData(aId) {
    const queryObj = {
      incentive_id: aId
    };
    console.log(queryObj);
    const incentiveQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.incentiveService.getIncentiveDataById(incentiveQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_incentive_exist === true) {
            this.incentiveData = response.data.incentive;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/incentives'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          }
      },
      err => console.error(err)
    );
  }
  viewIncentiveBack() {
    window.history.back();
  }
}
