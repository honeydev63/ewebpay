import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
    providedIn: 'root'
})

export class SalesOrderDataService {
    // Below Subjects is used to reload the homepage api
    private newCustomerTagSource = new Subject<any>();
    newCustomerTagSource$ = this.newCustomerTagSource.asObservable();
    // end of the above
    // Below Method is used to reload HomePage Api
    newCustomerTag(data: boolean) {
        this.newCustomerTagSource.next(data);
    }
    // End of the Above Method
}

