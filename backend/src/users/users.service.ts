import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    async updateDetails(userId: number, realName: string, email: string): Promise<User> {
        console.log(`[UsersService] Updating details for user ${userId}:`, { realName, email });
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if email is being changed and if it's already taken
        if (email !== user.email) {
            const existingUser = await this.usersRepository.findOne({ where: { email } });
            if (existingUser) {
                console.warn(`[UsersService] Email ${email} already in use`);
                throw new BadRequestException('Email already in use');
            }
        }

        user.realName = realName;
        user.email = email;
        const savedUser = await this.usersRepository.save(user); // Wait for save
        console.log(`[UsersService] Details updated successfully for user ${userId}`);
        // Return a fresh copy without password
        const { password, ...result } = savedUser;
        return result as User;
    }

    async updatePassword(userId: number, currentPass: string, newPass: string): Promise<void> {
        console.log(`[UsersService] Updating password for user ${userId}`);
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) {
            console.warn(`[UsersService] Current password mismatch for user ${userId}`);
            throw new BadRequestException('Current password is incorrect');
        }

        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(newPass, salt);
        await this.usersRepository.save(user);
        console.log(`[UsersService] Password updated successfully for user ${userId}`);
    }
}
