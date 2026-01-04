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

    async findAllForUser(userId: number, jobRoleId?: number | null): Promise<Skill[]> {
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
        return this.findAllForManager(userId, jobRoleId);
    }

    async findAllForManager(managerId: number, jobRoleId?: number | null): Promise<Skill[]> {
        console.log(`findAllForManager: managerId=${managerId} jobRoleId=${jobRoleId}`);
        const query = this.skillsRepository.createQueryBuilder('skill')
            .leftJoinAndSelect('skill.manager', 'manager')
            .leftJoinAndSelect('skill.jobRole', 'jobRole')
            .where('manager.id = :managerId', { managerId });

        if (jobRoleId !== undefined) {
            if (jobRoleId === null) {
                console.log('Filtering for NO role (General Skills)');
                // Check using the explicit column on the entity
                query.andWhere('skill.jobRoleId IS NULL');
            } else {
                console.log(`Filtering for role ${jobRoleId}`);
                query.andWhere('jobRole.id = :jobRoleId', { jobRoleId });
            }
        }

        return query.getMany();
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
