import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/users';

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }

  updateUserDetails(userId: number, data: { realName: string; email: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/details`, data);
  }

  updateUserPassword(userId: number, data: { currentPass: string; newPass: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/password`, data);
  }

  assignManager(employeeId: number, managerId: number | null): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${employeeId}/assign-manager`, { managerId });
  }

  assignRoles(userId: number, currentRoleId: number, targetRoleId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/roles`, { currentRoleId, targetRoleId });
  }

  getMyTeam(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-team`);
  }
}
