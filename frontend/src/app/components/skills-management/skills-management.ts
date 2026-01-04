import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../shared/page-header/page-header';
import { SkillsService } from '../../services/skills.service';
import { AuthService } from '../../services/auth.service';
import { JobRolesService, JobRole } from '../../services/job-roles.service';

@Component({
    selector: 'app-skills-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
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
    newSkillDescription = '';
    newSkillTarget = 50;
    editingSkill: any = null;
    editSkillName = '';
    editSkillDescription = '';
    editSkillTarget = 50;

    ngOnInit() {
        this.loadRoles();
        // this.loadSkills(); // Loaded after roles are fetched
    }

    loadRoles() {
        this.jobRolesService.getRoles().subscribe(roles => {
            this.roles = roles;
            if (this.roles.length > 0) {
                this.selectedRoleId = this.roles[0].id;
                this.loadSkills();
            }
        });
    }

    loadSkills() {
        this.skillsService.getSkills(this.selectedRoleId ? this.selectedRoleId.toString() : 'null')
            .subscribe(skills => this.skills = skills);
    }

    onRoleChange() {
        this.loadSkills();
    }

    addSkill() {
        if (this.newSkillName) {
            this.skillsService.createSkill(
                {
                    name: this.newSkillName,
                    description: this.newSkillDescription,
                    targetLevel: this.newSkillTarget
                },
                this.selectedRoleId || undefined
            ).subscribe(() => {
                this.newSkillName = '';
                this.newSkillDescription = '';
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
        this.editSkillDescription = skill.description || '';
        this.editSkillTarget = skill.targetLevel || 50;
    }

    saveEdit() {
        if (this.editingSkill && this.editSkillName) {
            this.skillsService.updateSkill(this.editingSkill.id, {
                name: this.editSkillName,
                description: this.editSkillDescription,
                targetLevel: this.editSkillTarget
            }).subscribe(() => {
                this.editingSkill = null;
                this.editSkillName = '';
                this.editSkillDescription = '';
                this.editSkillTarget = 50;
                this.loadSkills();
            });
        }
    }

    cancelEdit() {
        this.editingSkill = null;
        this.editSkillName = '';
        this.editSkillDescription = '';
        this.editSkillTarget = 50;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
