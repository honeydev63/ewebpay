

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
    providedIn: 'root'
})

export class DialogService {
    // Observable string sources
    // For Login
    private loginModalOpenSource = new Subject<boolean>();
    private loginModalCloseSource = new Subject<boolean>();
    // Observable string streams
    loginModalOpen$ = this.loginModalOpenSource.asObservable();
    loginModalClose$ = this.loginModalCloseSource.asObservable();
    // Observable string sources
    // For Location
    private locationModalOpenSource = new Subject<boolean>();
    private locationModalCloseSource = new Subject<boolean>();
    // Observable string streams
    locationModalOpen$ = this.locationModalOpenSource.asObservable();
    locationModalClose$ = this.locationModalCloseSource.asObservable();
    // Service message commands
    loginModalOpen(data: boolean) {
        this.loginModalOpenSource.next(data);
    }
    loginModalClose(data: boolean) {
        this.loginModalCloseSource.next(data);
    }
    locationModalOpen(data: boolean) {
        this.locationModalOpenSource.next(data);
    }
    locationModalClose(data: boolean) {
        this.locationModalCloseSource.next(data);
    }
}

