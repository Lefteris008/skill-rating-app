import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SkillsService } from '../../services/skills.service';
import { AuthService } from '../../services/auth.service';
import { JobRolesService, JobRole } from '../../services/job-roles.service';

@Component({
    selector: 'app-skills-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './skills-management.html',
    styleUrl: './skills-management.css',
})
export class SkillsManagementComponent implements OnInit {
    private skillsService = inject(SkillsService);
    private authService = inject(AuthService);
    private jobRolesService = inject(JobRolesService);
    private router = inject(Router);

    skills: any[] = [];
    roles: JobRole[] = [];
    selectedRoleId: number | null = null;

    newSkillName = '';
    newSkillTarget = 50;
    editingSkill: any = null;
    editSkillName = '';
    editSkillTarget = 50;

    ngOnInit() {
        this.loadRoles();
        this.loadSkills();
    }

    loadRoles() {
        this.jobRolesService.getRoles().subscribe(roles => {
            this.roles = roles;
        });
    }

    loadSkills() {
        this.skillsService.getSkills(this.selectedRoleId ? this.selectedRoleId.toString() : undefined)
            .subscribe(skills => this.skills = skills);
    }

    onRoleChange() {
        this.loadSkills();
    }

    addSkill() {
        if (this.newSkillName) {
            this.skillsService.createSkill(
                { name: this.newSkillName, targetLevel: this.newSkillTarget },
                this.selectedRoleId || undefined
            ).subscribe(() => {
                this.newSkillName = '';
                this.newSkillTarget = 50;
                this.loadSkills();
            });
        }
    }

    deleteSkill(skillId: number) {
        this.skillsService.deleteSkill(skillId).subscribe(() => {
            this.loadSkills();
        });
    }

    startEdit(skill: any) {
        this.editingSkill = skill;
        this.editSkillName = skill.name;
        this.editSkillTarget = skill.targetLevel || 50;
    }

    saveEdit() {
        if (this.editingSkill && this.editSkillName) {
            this.skillsService.updateSkill(this.editingSkill.id, { name: this.editSkillName, targetLevel: this.editSkillTarget }).subscribe(() => {
                this.editingSkill = null;
                this.editSkillName = '';
                this.editSkillTarget = 50;
                this.loadSkills();
            });
        }
    }

    cancelEdit() {
        this.editingSkill = null;
        this.editSkillName = '';
        this.editSkillTarget = 50;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
