import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobRole {
    id: number;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class JobRolesService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/job-roles';

    getRoles(): Observable<JobRole[]> {
        return this.http.get<JobRole[]>(this.apiUrl);
    }

    createRole(name: string): Observable<JobRole> {
        return this.http.post<JobRole>(this.apiUrl, { name });
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
