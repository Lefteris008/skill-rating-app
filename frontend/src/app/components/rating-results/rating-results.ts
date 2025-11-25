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
    this.skillsService.getSkills().subscribe(skills => {
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
  getLabelTop(skillId: number, type: 'target' | 'employee' | 'manager'): string {
    const ratings = this.getRatingsForSkill(skillId);
    const target = ratings.target || 0;
    const employee = ratings.employeeRating || 0;
    const manager = ratings.managerRating || 0;

    // Base positions
    const TOP_POS = '-28px';
    const BOTTOM_POS = '55px'; // Below the 50px slider
    const STACK_TOP_POS = '-52px'; // Stacked above TOP

    if (type === 'target') return TOP_POS;
    if (type === 'employee') return BOTTOM_POS;

    if (type === 'manager') {
      // Check collision with Target (Top)
      const closeToTarget = Math.abs(manager - target) < 12;

      // Check collision with Employee (Bottom)
      const closeToEmployee = Math.abs(manager - employee) < 12;

      if (closeToTarget && closeToEmployee) {
        // 3-way collision: Stack above Target
        return STACK_TOP_POS;
      }

      if (closeToTarget) {
        // Avoid Target -> Go Bottom
        return BOTTOM_POS;
      }

      if (closeToEmployee) {
        // Avoid Employee -> Go Top (Default)
        return TOP_POS;
      }

      // Default to Top
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
