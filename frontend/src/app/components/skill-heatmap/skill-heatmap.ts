import { Component, inject, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class SkillHeatmapComponent implements OnInit, OnChanges {
  private skillsService = inject(SkillsService);
  private ratingsService = inject(RatingsService);
  private authService = inject(AuthService);

  @Input() userId: number | null = null;
  @Input() readOnly = false;
  @Input() employeeName: string = ''; // Name to show on employee rating marker
  @Input() isManagerView: boolean = false; // If true, don't auto-save
  @Input() showValues = true; // Hide numeric labels for employee self view

  skills: any[] = [];
  ratings: any[] = []; // Current ratings being viewed/edited
  employeeSelfRatings: any[] = []; // Employee's original self-ratings (for reference)
  managerRatings: Map<number, number> = new Map(); // Local manager ratings before submit
  selfRatings: Map<number, number> = new Map(); // Local employee ratings before submit
  user: any = null;

  ngOnInit() {
    this.user = this.authService.getUser();
    // Only default to current user if NOT in manager view
    if (!this.userId && this.user && !this.isManagerView) {
      this.userId = this.user.sub;
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId']) {
      if (this.userId) {
        this.loadData();
      }
    }
  }

  loadData() {
    this.skillsService.getSkills(undefined, this.userId || undefined).subscribe(skills => {
      this.skills = skills;
      if (!this.isManagerView) {
        skills.forEach(skill => {
          if (!this.selfRatings.has(skill.id)) {
            this.selfRatings.set(skill.id, 0);
          }
        });
      }
    });

    if (this.userId) {
      this.ratingsService.getRatings(this.userId).subscribe(ratings => {
        // If viewing as manager (employeeName is set), save employee self-ratings first
        if (this.employeeName && this.employeeSelfRatings.length === 0) {
          this.employeeSelfRatings = ratings.filter(r => r.selfRating && r.selfRating > 0);
        }
        this.ratings = ratings;

        if (!this.isManagerView) {
          ratings.forEach(rating => {
            this.selfRatings.set(rating.skillId, rating.selfRating || 0);
          });
        }
      });
    }
  }

  getRating(skillId: number): number {
    if (this.isManagerView) {
      if (this.managerRatings.has(skillId)) {
        return this.managerRatings.get(skillId)!;
      }
      return 0;
    }

    if (this.selfRatings.has(skillId)) {
      return this.selfRatings.get(skillId)!;
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

    this.selfRatings.set(skillId, value);

    const existingRating = this.ratings.find(r => r.skillId === skillId);
    if (existingRating) {
      existingRating.selfRating = value;
    } else {
      this.ratings.push({ skillId, selfRating: value, userId: this.userId, managerRating: 0, targetRating: 0 });
    }
  }

  getManagerRatings(): Map<number, number> {
    return this.managerRatings;
  }

  getSelfAssessmentPayload(): { skillId: number; value: number }[] {
    if (this.readOnly || this.isManagerView) {
      return [];
    }

    if (this.skills.length === 0 && this.selfRatings.size > 0) {
      return Array.from(this.selfRatings.entries())
        .filter(([, value]) => value > 0)
        .map(([skillId, value]) => ({ skillId, value }));
    }

    return this.skills
      .map(skill => ({
        skillId: skill.id,
        value: this.selfRatings.get(skill.id) ?? 0,
      }))
      .filter(entry => entry.value > 0);
  }
}
