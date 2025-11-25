import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SkillHeatmapComponent } from '../skill-heatmap/skill-heatmap';
import { PageHeaderComponent } from '../shared/page-header/page-header';
import { RatingsService } from '../../services/ratings.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkillHeatmapComponent, RouterModule, PageHeaderComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ratingsService = inject(RatingsService);
  user: any = null;
  username: string = "";
  showSelfRating = false;
  isSubmitting = false;
  hasCompletedSelfAssessment = false;
  showSubmitConfirmation = false;
  pendingSelfAssessmentPayload: { skillId: number; value: number }[] = [];
  selfAssessmentError: string | null = null;

  @ViewChild(SkillHeatmapComponent) skillHeatmap?: SkillHeatmapComponent;

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user?.role === 'employee') {
      this.checkSelfAssessmentStatus();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  handleSelfAssessmentAction() {
    if (this.hasCompletedSelfAssessment && this.user) {
      this.router.navigate(['/rating-results', this.user.sub]);
      return;
    }

    this.showSelfRating = !this.showSelfRating;
    if (this.showSelfRating === false) {
      this.selfAssessmentError = null;
    }
  }

  openSubmitConfirmation() {
    if (!this.skillHeatmap || this.isSubmitting || !this.user) {
      return;
    }

    const payload = this.skillHeatmap.getSelfAssessmentPayload();

    if (!payload.length) {
      this.selfAssessmentError = 'Please rate at least one skill before submitting.';
      return;
    }

    this.selfAssessmentError = null;
    this.pendingSelfAssessmentPayload = payload;
    this.showSubmitConfirmation = true;
  }

  cancelSubmitConfirmation() {
    this.showSubmitConfirmation = false;
    this.pendingSelfAssessmentPayload = [];
  }

  confirmSubmitSelfAssessment() {
    if (this.pendingSelfAssessmentPayload.length === 0 || !this.user) {
      return;
    }

    this.showSubmitConfirmation = false;
    this.submitSelfAssessment(this.pendingSelfAssessmentPayload);
  }

  private submitSelfAssessment(payload: { skillId: number; value: number }[]) {
    if (!payload.length || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    forkJoin(payload.map(entry => this.ratingsService.saveRating(entry))).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSelfRating = false;
        this.pendingSelfAssessmentPayload = [];
        this.selfAssessmentError = null;
        this.markSelfAssessmentComplete();
        this.router.navigate(['/rating-results', this.user.sub]);
      },
      error: () => {
        this.isSubmitting = false;
        this.pendingSelfAssessmentPayload = [];
        this.selfAssessmentError = 'Failed to submit your ratings. Please try again.';
      }
    });
  }

  private checkSelfAssessmentStatus() {
    const storageKey = this.getSelfAssessmentStorageKey();
    if (localStorage.getItem(storageKey) === 'true') {
      this.hasCompletedSelfAssessment = true;
      this.selfAssessmentError = null;
      return;
    }

    this.ratingsService.getRatings(this.user.sub).subscribe(ratings => {
      this.hasCompletedSelfAssessment = ratings.some(r => r.selfRating && r.selfRating > 0);
      if (this.hasCompletedSelfAssessment) {
        localStorage.setItem(storageKey, 'true');
        this.selfAssessmentError = null;
      }
    });
  }

  private markSelfAssessmentComplete() {
    this.hasCompletedSelfAssessment = true;
    localStorage.setItem(this.getSelfAssessmentStorageKey(), 'true');
    this.selfAssessmentError = null;
  }

  private getSelfAssessmentStorageKey() {
    return `selfAssessmentCompleted:${this.user?.sub}`;
  }
}
