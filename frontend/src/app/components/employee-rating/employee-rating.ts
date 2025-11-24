import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SkillHeatmapComponent } from '../skill-heatmap/skill-heatmap';
import { UsersService } from '../../services/users.service';
import { RatingsService } from '../../services/ratings.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-employee-rating',
  standalone: true,
  imports: [CommonModule, RouterModule, SkillHeatmapComponent],
  templateUrl: './employee-rating.html',
  styleUrl: './employee-rating.css',
})
export class EmployeeRatingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private ratingsService = inject(RatingsService);
  private authService = inject(AuthService);

  @ViewChild(SkillHeatmapComponent) heatmapComponent!: SkillHeatmapComponent;

  employeeId: number | null = null;
  employeeName: string = '';
  managerName: string = '';
  isSubmitting: boolean = false;

  ngOnInit() {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));

    const currentUser = this.authService.getUser();
    this.managerName = currentUser?.username || 'Manager';

    // Fetch employee details to get their name
    this.usersService.getUsers().subscribe(users => {
      const employee = users.find(u => u.id === this.employeeId);
      if (employee) {
        this.employeeName = employee.username;
      }
    });
  }

  submitRatings() {
    if (!this.heatmapComponent || this.isSubmitting) return;

    this.isSubmitting = true;
    const managerRatings = this.heatmapComponent.getManagerRatings();

    console.log('Manager ratings to save:', managerRatings);

    // Convert Map to array of rating requests
    const ratingRequests: any[] = [];
    managerRatings.forEach((value: number, skillId: number) => {
      console.log(`Saving manager rating: skill ${skillId} = ${value}`);
      ratingRequests.push(
        this.ratingsService.saveManagerRating(this.employeeId!, skillId, value)
      );
    });

    console.log(`Total rating requests: ${ratingRequests.length}`);

    // Save all ratings or just navigate if none  
    if (ratingRequests.length > 0) {
      forkJoin(ratingRequests).subscribe({
        next: (responses) => {
          console.log('All manager ratings saved successfully:', responses);
          // NOW finalize the ratings so they become visible
          this.ratingsService.finalizeRatings(this.employeeId!).subscribe({
            next: () => {
              console.log('Ratings finalized successfully');
              // Navigate to results page
              this.router.navigate(['/rating-results', this.employeeId]);
            },
            error: (err) => {
              console.error('Error finalizing ratings:', err);
              alert('Failed to finalize ratings: ' + err.message);
              this.isSubmitting = false;
            }
          });
        },
        error: (err) => {
          console.error('Error saving ratings:', err);
          alert('Failed to save ratings: ' + err.message);
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('No ratings to save, navigating to results');
      // Navigate even if no ratings to save
      this.router.navigate(['/rating-results', this.employeeId]);
    }
  }
}
