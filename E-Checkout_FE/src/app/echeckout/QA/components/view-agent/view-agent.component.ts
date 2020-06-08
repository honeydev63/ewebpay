import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { QAService } from '../../services/qa.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EpharmaToasterService } from 'src/app/core/services/toaster.service';
import { EpharmaUtilities } from 'src/app/core/utilities/utility';

@Component({
  selector: 'app-view-agent',
  templateUrl: './view-agent.component.html',
  styleUrls: ['./view-agent.component.scss']
})
export class ViewQAAgentComponent implements OnInit {
  sub: any;
  agentId: number;
  agentData: any;
  constructor( private formBuilder: FormBuilder,
               private qaService: QAService ,
               private router: Router,
               private route: ActivatedRoute,
               private toastrService: EpharmaToasterService, ) {
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
   // Method: to fetch details for agent from BE
  getAgentData(aId) {
    const queryObj = {
      agent_id: aId
    };
    console.log(queryObj);
    const productQueryStr = EpharmaUtilities.generateQueryString(queryObj);
    this.qaService.getAgentDataById(productQueryStr).subscribe(
      response => {
        if ( !!response && !!response.data && response.data.is_user_exist === true) {
            this.agentData = response.data.user;
          } else {
            this.toastrService.showError('Error', 'Something went wrong. Please Try again latter');
            this.router.navigate(['/qa'], { queryParams: { currentPage: 1, perPage: 50}, queryParamsHandling: 'merge' });
          }
      },
      err => console.error(err)
    );
  }
  // End of above code
  viewAgentBack() {
    window.history.back();
  }
}
// End of code
