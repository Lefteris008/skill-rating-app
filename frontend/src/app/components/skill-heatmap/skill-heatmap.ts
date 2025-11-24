import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillsService } from '../../services/skills.service';
import { RatingsService } from '../../services/ratings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-skill-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-heatmap.html',
  styleUrl: './skill-heatmap.css',
})
export class SkillHeatmapComponent implements OnInit {
  private skillsService = inject(SkillsService);
  private ratingsService = inject(RatingsService);
  private authService = inject(AuthService);

  @Input() userId: number | null = null;
  @Input() readOnly = false;
  @Input() employeeName: string = ''; // Name to show on employee rating marker
  @Input() isManagerView: boolean = false; // If true, don't auto-save

  skills: any[] = [];
  ratings: any[] = []; // Current ratings being viewed/edited
  employeeSelfRatings: any[] = []; // Employee's original self-ratings (for reference)
  managerRatings: Map<number, number> = new Map(); // Local manager ratings before submit
  user: any = null;

  ngOnInit() {
    this.user = this.authService.getUser();
    if (!this.userId && this.user) {
      this.userId = this.user.sub;
    }

    this.loadData();
  }

  loadData() {
    this.skillsService.getSkills().subscribe(skills => {
      this.skills = skills;
    });

    if (this.userId) {
      this.ratingsService.getRatings(this.userId).subscribe(ratings => {
        console.log('All ratings for user:', ratings);
        console.log('Employee name:', this.employeeName);

        // If viewing as manager (employeeName is set), save employee self-ratings first
        if (this.employeeName && this.employeeSelfRatings.length === 0) {
          this.employeeSelfRatings = ratings.filter(r => r.selfRating && r.selfRating > 0);
          console.log('Employee self-ratings:', this.employeeSelfRatings);
        }
        this.ratings = ratings;
      });
    }
  }

  getRating(skillId: number): number {
    // If manager view, return local rating if set
    if (this.isManagerView && this.managerRatings.has(skillId)) {
      return this.managerRatings.get(skillId)!;
    }
    const rating = this.ratings.find(r => r.skillId === skillId);
    return rating?.selfRating || 0;
  }

  getEmployeeSelfRating(skillId: number): number {
    if (!this.employeeName) return 0;
    const rating = this.employeeSelfRatings.find(r => r.skillId === skillId);
    return rating?.selfRating || 0;
  }

  onSliderChange(skillId: number, event: any) {
    if (this.readOnly) return;

    const value = parseInt(event.target.value, 10);

    // If manager view, just store locally
    if (this.isManagerView) {
      this.managerRatings.set(skillId, value);
      return;
    }

    // Update local ratings immediately for responsive UI (employee self-rating)
    const existingRating = this.ratings.find(r => r.skillId === skillId);
    if (existingRating) {
      existingRating.selfRating = value;
    } else {
      this.ratings.push({ skillId, selfRating: value, userId: this.userId, managerRating: 0, targetRating: 0 });
    }

    const rating = {
      skillId,
      userId: this.userId,
      value,
      raterId: this.user.sub
    };

    this.ratingsService.saveRating(rating).subscribe(() => {
      // Rating saved to backend successfully
    });
  }

  getManagerRatings(): Map<number, number> {
    return this.managerRatings;
  }
}
