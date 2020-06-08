import { Component, OnInit } from '@angular/core';
import { RoleService } from 'src/app/core/services/role.service';
import { UserRole } from 'src/app/core/dictionary/user-role';

@Component({
  selector: 'app-echeckout-sidebar',
  templateUrl: './echeckout-sidebar.component.html',
  styleUrls: ['./echeckout-sidebar.component.scss']
})
export class EcheckoutSidebarComponent implements OnInit {
  displaySidebar = false;
  userRole = UserRole;
  localUserRole: number;
  constructor(private roleService: RoleService) { }
  ngOnInit() {
    this.localUserRole = this.roleService.getUserRole();
  }
  showSidebar() {
    this.displaySidebar = !this.displaySidebar;
  }
}
