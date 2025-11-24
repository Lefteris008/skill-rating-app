import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { JobRolesService, JobRole } from '../../services/job-roles.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanelComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private jobRolesService = inject(JobRolesService);
  private router = inject(Router);

  users: any[] = [];
  admins: any[] = [];
  managers: any[] = [];
  employees: any[] = [];
  unassignedEmployees: any[] = [];
  newUser = { realName: '', email: '', username: '', password: '', role: 'employee' };

  expandedSections: Set<string | number> = new Set();
  reassigningEmployee: any = null;
  selectedManagerId: number | null = null;
  editingUser: any = null;
  editUserData: any = { realName: '', email: '', username: '', role: '' };

  newRoleName: string = '';
  roles: JobRole[] = [];

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadRoles() {
    this.jobRolesService.getRoles().subscribe(roles => {
      this.roles = roles;
    });
  }

  addRole() {
    if (this.newRoleName.trim()) {
      this.jobRolesService.createRole(this.newRoleName).subscribe(() => {
        this.newRoleName = '';
        this.loadRoles();
      });
    }
  }

  deleteRole(id: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.jobRolesService.deleteRole(id).subscribe(() => {
        this.loadRoles();
      });
    }
  }

  loadUsers() {
    this.usersService.getUsers().subscribe(users => {
      this.users = users;
      this.admins = users.filter(u => u.role === 'admin');
      this.managers = users.filter(u => u.role === 'manager');
      this.employees = users.filter(u => u.role === 'employee');
      this.unassignedEmployees = this.employees.filter(e => !e.manager);
    });
  }

  addUser() {
    if (this.newUser.username && this.newUser.password && this.newUser.realName && this.newUser.email) {
      this.usersService.createUser(this.newUser).subscribe(() => {
        this.newUser = { realName: '', email: '', username: '', password: '', role: 'employee' };
        this.loadUsers();
      });
    }
  }

  getManagerTeam(managerId: number): any[] {
    return this.employees.filter(e => e.manager?.id === managerId);
  }

  toggleManager(managerId: number) {
    if (this.expandedSections.has(managerId)) {
      this.expandedSections.delete(managerId);
    } else {
      this.expandedSections.add(managerId);
    }
  }

  toggleSection(section: string) {
    if (this.expandedSections.has(section)) {
      this.expandedSections.delete(section);
    } else {
      this.expandedSections.add(section);
    }
  }

  isExpanded(id: string | number): boolean {
    return this.expandedSections.has(id);
  }

  startReassign(employee: any) {
    this.reassigningEmployee = employee;
    this.selectedManagerId = employee.manager?.id || null;
  }

  confirmReassign() {
    if (this.reassigningEmployee) {
      this.usersService.assignManager(
        this.reassigningEmployee.id,
        this.selectedManagerId
      ).subscribe(() => {
        this.reassigningEmployee = null;
        this.selectedManagerId = null;
        this.loadUsers();
      });
    }
  }

  cancelReassign() {
    this.reassigningEmployee = null;
    this.selectedManagerId = null;
  }

  startEdit(user: any) {
    this.editingUser = user;
    this.editUserData = {
      realName: user.realName,
      email: user.email,
      username: user.username,
      role: user.role
    };
  }

  confirmEdit() {
    if (this.editingUser && this.editUserData.realName && this.editUserData.email && this.editUserData.username) {
      this.usersService.updateUser(this.editingUser.id, this.editUserData).subscribe(() => {
        this.editingUser = null;
        this.editUserData = { realName: '', email: '', username: '', role: '' };
        this.loadUsers();
      });
    }
  }

  cancelEdit() {
    this.editingUser = null;
    this.editUserData = { realName: '', email: '', username: '', role: '' };
  }

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete user "${user.realName}"? This action cannot be undone.`)) {
      this.usersService.deleteUser(user.id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
