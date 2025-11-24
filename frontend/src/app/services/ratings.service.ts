import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/ratings';

  getRatings(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`).pipe(
      map(ratings => {
        // Convert backend format to frontend format
        return ratings.map(r => ({
          id: r.id,
          skillId: r.skill.id,
          userId: r.user?.id || userId,
          selfRating: r.selfRating || 0,
          managerRating: r.managerRating || 0,
          targetRating: r.targetRating || 0
        }));
      })
    );
  }

  saveRating(rating: any): Observable<any> {
    // Use the self-rating endpoint
    return this.http.post(`${this.apiUrl}/self`, {
      skillId: rating.skillId,
      rating: rating.value
    });
  }

  saveManagerRating(userId: number, skillId: number, rating: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/manager/${userId}`, {
      skillId: skillId,
      rating: rating
    });
  }

  finalizeRatings(userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/finalize/${userId}`, {});
  }

  getFinalizedUserIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/finalized-users`);
  }
}
