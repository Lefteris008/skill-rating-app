import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/skills';

  getSkills(jobRoleId?: string, userId?: number) {
    let params: any = {};
    if (jobRoleId !== undefined) {
      params.jobRoleId = jobRoleId;
    }
    if (userId) {
      params.userId = userId.toString();
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  createSkill(skill: any, jobRoleId?: number) {
    const payload = { ...skill, jobRoleId };
    return this.http.post(this.apiUrl, payload);
  }

  deleteSkill(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateSkill(id: number, skill: any) {
    return this.http.patch(`${this.apiUrl}/${id}`, skill);
  }
}
