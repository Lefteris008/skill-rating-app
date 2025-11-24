import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SkillHeatmapComponent } from '../skill-heatmap/skill-heatmap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SkillHeatmapComponent, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  user: any = null;
  username: string = "";

  ngOnInit() {
    this.user = this.authService.getUser();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
