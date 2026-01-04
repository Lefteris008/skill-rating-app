import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../shared/page-header/page-header';
import { SkillsService } from '../../services/skills.service';
import { RatingsService } from '../../services/ratings.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-rating-results',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  templateUrl: './rating-results.html',
  styleUrl: './rating-results.css',
})
export class RatingResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private skillsService = inject(SkillsService);
  private ratingsService = inject(RatingsService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  employeeId: number | null = null;
  employeeName: string = '';
  managerName: string = '';
  skills: any[] = [];
  ratings: any = {};
  isEmployeeView = false;
  hasManagerRatings = false;
  showManagerPendingMessage = false;
  backLink: string = '/dashboard';
  backLabel: string = '← Dashboard';

  ngOnInit() {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    const currentUser = this.authService.getUser();
    this.managerName = currentUser?.username || 'Manager';
    this.isEmployeeView = currentUser?.role === 'employee';

    if (currentUser?.role === 'manager') {
      this.backLink = '/manager-rating';
      this.backLabel = '← Back to List';
    } else {
      this.backLink = '/dashboard';
      this.backLabel = '← Dashboard';
    }

    this.loadData();
  }

  loadData() {
    // Load employee details
    this.usersService.getUsers().subscribe(users => {
      const employee = users.find(u => u.id === this.employeeId);
      if (employee) {
        this.employeeName = employee.username;
        // Get the manager's name from the employee's manager relationship
        if (employee.manager) {
          this.managerName = employee.manager.username;
        }
      }
    });

    // Load skills
    this.skillsService.getSkills(undefined, this.employeeId || undefined).subscribe(skills => {
      this.skills = skills;
    });

    // Load ratings
    if (this.employeeId) {
      this.ratingsService.getRatings(this.employeeId).subscribe(ratings => {
        console.log('Ratings data from backend:', ratings);
        // Process ratings by skill
        ratings.forEach((r: any) => {
          this.ratings[r.skillId] = {
            employeeRating: r.selfRating || 0,
            managerRating: r.managerRating || 0,
            target: r.targetRating || 0
          };
        });
        console.log('Processed ratings:', this.ratings);
        this.evaluateManagerRatings(ratings);
      });
    }
  }

  getRatingsForSkill(skillId: number) {
    return this.ratings[skillId] || { employeeRating: 0, managerRating: 0, target: 0 };
  }

  // Compute top position for labels
  getLabelTop(skill: any, type: 'target' | 'employee' | 'manager'): string {
    const ratings = this.getRatingsForSkill(skill.id);
    const target = skill.targetLevel || 0; // Use true target level from skill
    const employee = ratings.employeeRating || 0;
    const manager = ratings.managerRating || 0;

    // Base positions
    const TOP_POS = '-28px';
    const BOTTOM_POS = '55px'; // Below the 50px slider
    const STACK_TOP_POS = '-52px'; // Stacked above TOP (Manager)

    // Employee always on BOTTOM
    if (type === 'employee') return BOTTOM_POS;

    // Manager always on TOP (unless colliding, but requirement says Manager is Top)
    if (type === 'manager') return TOP_POS;

    if (type === 'target') {
      // Check collision with Manager
      const closeToManager = Math.abs(manager - target) < 12;

      // Check collision with Employee
      const closeToEmployee = Math.abs(employee - target) < 12;

      // 3-way collision: Manager TOP, Employee BOTTOM, Target SUPER TOP
      if (closeToManager && closeToEmployee) {
        return STACK_TOP_POS;
      }

      // Collision with Manager: Manager TOP, Target BOTTOM
      if (closeToManager) {
        return BOTTOM_POS;
      }

      // Collision with Employee: Employee BOTTOM, Target TOP
      if (closeToEmployee) {
        return TOP_POS;
      }

      // No collision: Default TOP
      return TOP_POS;
    }

    return TOP_POS;
  }

  private evaluateManagerRatings(ratings: any[]) {
    this.hasManagerRatings = ratings.some((rating: any) => rating.managerRating && rating.managerRating > 0);
    this.showManagerPendingMessage = this.isEmployeeView && !this.hasManagerRatings;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
