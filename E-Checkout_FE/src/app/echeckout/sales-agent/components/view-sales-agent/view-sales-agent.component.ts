import { Component, OnInit } from '@angular/core';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';
import { FormBuilder } from '@angular/forms';
import { SalesAgentService } from '../../services/sales-agent.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';

@Component({
  selector: 'app-view-sales-agent',
  templateUrl: './view-sales-agent.component.html',
  styleUrls: ['./view-sales-agent.component.scss']
})
export class ViewSalesAgentComponent implements OnInit {
  sub: any;
  agentId: number;
  agentData: any;
  constructor(
    private formBuilder: FormBuilder,
    private salesAgentService: SalesAgentService ,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: EpharmaToasterService,
  ) {
    this.sub = this.route
    .queryParams
    .subscribe(params => {
      if (!!params.id && params.id !== '') {
      this.agentId = params.id;
      this.getAgentData(this.agentId);
      }
    });
   }

  ngOnInit() {
  }
  getAgentData(aId) {
    const queryObj = {
      agent_id: aId
    };
    console.log(queryObj);
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.salesAgentService.getAgentDataById(productQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_user_exist === true) {
            this.agentData = response.data.user;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/sales-agent'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          }
      },
      err => console.error(err)
    );
  }
  viewAgentBack() {
    window.history.back();
  }
}
