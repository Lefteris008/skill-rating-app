import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { JobRolesService, JobRole } from '../../services/job-roles.service';

@Component({
    selector: 'app-team-roles',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './team-roles.html',
    styleUrl: './team-roles.css',
})
export class TeamRolesComponent implements OnInit {
    private usersService = inject(UsersService);
    private authService = inject(AuthService);
    private jobRolesService = inject(JobRolesService);

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
}
