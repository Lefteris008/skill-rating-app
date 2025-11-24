import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000'; // Adjust if needed
  private tokenKey = 'auth_token';

  login(credentials: any) {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.saveToken(response.access_token))
    );
  }

  saveToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): any {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode(token);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
