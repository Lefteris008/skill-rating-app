import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(username: string): Promise<User | undefined> {
        const user = await this.usersRepository.findOne({ where: { username } });
        return user || undefined;
    }

    async create(user: Partial<User>): Promise<User> {
        if (!user.password) {
            throw new Error('Password is required');
        }
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(user.password, salt);
        const newUser = this.usersRepository.create({
            ...user,
            password: hashedPassword,
        });
        return this.usersRepository.save(newUser);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find({ relations: ['manager', 'currentRole', 'targetRole'] });
    }

    async assignManager(userId: number, managerId: number | null): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        if (managerId) {
            const manager = await this.usersRepository.findOne({ where: { id: managerId } });
            if (!manager || manager.role !== 'manager') {
                throw new Error('Invalid manager ID');
            }
            user.manager = manager;
        } else {
            user.manager = null as any; // Allow null to unassign manager
        }

        return this.usersRepository.save(user);
    }

    async getTeamMembers(managerId: number): Promise<User[]> {
        return this.usersRepository.find({
            where: { manager: { id: managerId } },
            relations: ['manager'],
        });
    }

    async update(userId: number, updateData: Partial<User>): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow password updates through this endpoint for security
        if (updateData.password) {
            const salt = await bcrypt.genSalt();
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        Object.assign(user, updateData);
        return this.usersRepository.save(user);
    }

    async delete(userId: number): Promise<void> {
        // First, unassign this user as manager from all subordinates
        await this.usersRepository
            .createQueryBuilder()
            .update(User)
            .set({ manager: null as any })
            .where('managerId = :userId', { userId })
            .execute();

        // Then delete the user (ratings will cascade delete automatically)
        const user = await this.usersRepository.findOne({ 
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }

        await this.usersRepository.remove(user);
    }

    async assignRoles(userId: number, currentRoleId: number, targetRoleId: number): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        user.currentRole = { id: currentRoleId } as any;
        user.targetRole = { id: targetRoleId } as any;

        return this.usersRepository.save(user);
    }
}
