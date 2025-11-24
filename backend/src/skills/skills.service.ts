import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SkillsService {
    constructor(
        @InjectRepository(Skill)
        private skillsRepository: Repository<Skill>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(skill: Partial<Skill>, managerId: number, jobRoleId?: number): Promise<Skill> {
        const newSkill = this.skillsRepository.create({
            ...skill,
            manager: { id: managerId } as any,
            jobRole: jobRoleId ? { id: jobRoleId } as any : null,
        });
        return this.skillsRepository.save(newSkill);
    }

    async findAllForUser(userId: number): Promise<Skill[]> {
        // First, get the user to check their role and manager
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['manager', 'targetRole'],
        });

        if (!user) {
            return [];
        }

        // If user is an employee, get their manager's skills filtered by their target role
        if (user.role === 'employee' && user.manager) {
            const where: any = { manager: { id: user.manager.id } };
            if (user.targetRole) {
                where.jobRole = { id: user.targetRole.id };
            }
            return this.skillsRepository.find({
                where,
                relations: ['manager', 'jobRole'],
            });
        }

        // If user is a manager, get their own skills
        return this.findAllForManager(userId);
    }

    async findAllForManager(managerId: number, jobRoleId?: number): Promise<Skill[]> {
        const where: any = { manager: { id: managerId } };
        if (jobRoleId) {
            where.jobRole = { id: jobRoleId };
        }
        return this.skillsRepository.find({
            where,
            relations: ['manager', 'jobRole'],
        });
    }

    async findOne(id: number, managerId: number): Promise<Skill | undefined> {
        const skill = await this.skillsRepository.findOne({
            where: { id, manager: { id: managerId } },
            relations: ['manager'],
        });
        return skill || undefined;
    }

    async update(id: number, skill: Partial<Skill>, managerId: number): Promise<Skill | undefined> {
        // First verify the skill belongs to this manager
        const existing = await this.findOne(id, managerId);
        if (!existing) {
            throw new Error('Skill not found or access denied');
        }
        await this.skillsRepository.update(id, skill);
        return this.findOne(id, managerId);
    }

    async remove(id: number, managerId: number): Promise<void> {
        // First verify the skill belongs to this manager
        const existing = await this.findOne(id, managerId);
        if (!existing) {
            throw new Error('Skill not found or access denied');
        }
        await this.skillsRepository.delete(id);
    }
}
