import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { RatingsService } from '../../services/ratings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manager-rating',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-rating.html',
  styleUrl: './manager-rating.css',
})
export class ManagerRatingComponent implements OnInit {
  private usersService = inject(UsersService);
  private ratingsService = inject(RatingsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  employees: any[] = [];
  finalizedUserIds: Set<number> = new Set();

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    // Fetch only team members assigned to this manager
    this.usersService.getMyTeam().subscribe(users => {
      this.employees = users;
    });

    this.ratingsService.getFinalizedUserIds().subscribe(ids => {
      this.finalizedUserIds = new Set(ids);
    });
  }

  selectEmployee(employee: any) {
    if (this.finalizedUserIds.has(employee.id)) {
      // If already rated, go to results
      this.router.navigate(['/rating-results', employee.id]);
    } else {
      // Navigate to employee rating page
      this.router.navigate(['/employee-rating', employee.id]);
    }
  }

  isRated(employeeId: number): boolean {
    return this.finalizedUserIds.has(employeeId);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
