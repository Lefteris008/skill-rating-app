import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AdminPanelComponent } from './components/admin-panel/admin-panel';
import { ManagerRatingComponent } from './components/manager-rating/manager-rating';
import { EmployeeRatingComponent } from './components/employee-rating/employee-rating';
import { RatingResultsComponent } from './components/rating-results/rating-results';
import { SkillsManagementComponent } from './components/skills-management/skills-management';
import { TeamRolesComponent } from './components/team-roles/team-roles';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'admin', component: AdminPanelComponent, canActivate: [AuthGuard] },
    { path: 'skills-management', component: SkillsManagementComponent, canActivate: [AuthGuard] },
    { path: 'manager-rating', component: ManagerRatingComponent, canActivate: [AuthGuard] },
    { path: 'team-roles', component: TeamRolesComponent, canActivate: [AuthGuard] },
    { path: 'employee-rating/:id', component: EmployeeRatingComponent, canActivate: [AuthGuard] },
    { path: 'rating-results/:id', component: RatingResultsComponent, canActivate: [AuthGuard] },
];
