import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../shared/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { JobRolesService, JobRole } from '../../services/job-roles.service';

@Component({
    selector: 'app-team-roles',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
    templateUrl: './team-roles.html',
    styleUrl: './team-roles.css',
})
export class TeamRolesComponent implements OnInit {
    private usersService = inject(UsersService);
    private authService = inject(AuthService);
    private jobRolesService = inject(JobRolesService);
    private router = inject(Router);

    employees: any[] = [];
    roles: JobRole[] = [];
    currentUser: any = null;

    ngOnInit() {
        this.currentUser = this.authService.getUser();
        this.loadRoles();
        this.loadTeam();
    }

    loadRoles() {
        this.jobRolesService.getRoles().subscribe(roles => {
            this.roles = roles;
        });
    }

    loadTeam() {
        if (this.currentUser) {
            this.usersService.getUsers().subscribe(users => {
                // Filter for employees managed by current user
                this.employees = users.filter(u =>
                    u.role === 'employee' &&
                    u.manager &&
                    u.manager.id === this.currentUser.sub
                ).map(emp => ({
                    ...emp,
                    currentRoleId: emp.currentRole?.id || null,
                    targetRoleId: emp.targetRole?.id || null
                }));
            });
        }
    }

    updateRoles(employee: any) {
        if (employee.currentRoleId && employee.targetRoleId) {
            this.usersService.assignRoles(
                employee.id,
                +employee.currentRoleId,
                +employee.targetRoleId
            ).subscribe(() => {
                // Optional: Show success toast
                console.log('Roles updated');
            });
        }
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
