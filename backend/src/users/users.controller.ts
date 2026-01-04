import { Controller, Get, Post, Body, UseGuards, Patch, Param, Request, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() user: Partial<User>): Promise<User> {
        return this.usersService.create(user);
    }

    @Get('my-team')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    getMyTeam(@Request() req): Promise<User[]> {
        return this.usersService.getTeamMembers(req.user.userId);
    }

    @Patch(':id/assign-manager')
    @Roles(UserRole.ADMIN)
    assignManager(@Param('id') id: string, @Body() body: { managerId: number | null }): Promise<User> {
        return this.usersService.assignManager(+id, body.managerId);
    }

    @Patch(':id/roles')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    assignRoles(
        @Param('id') id: string,
        @Body() body: { currentRoleId: number; targetRoleId: number },
    ) {
        return this.usersService.assignRoles(+id, body.currentRoleId, body.targetRoleId);
    }

    @Patch(':id/details')
    // No specific role required, but we must verify the user is updating themselves
    async updateDetails(@Param('id') id: string, @Body() body: { realName: string; email: string }, @Request() req) {
        console.log(`[UsersController] Update details request for ID ${id} from User ${req.user.userId}`);
        const userId = +id;
        // Allow admin to update anyone, otherwise users can only update themselves
        if (req.user.role !== UserRole.ADMIN && req.user.userId !== userId) {
            console.error(`[UsersController] Unauthorized access: User ${req.user.userId} trying to update ${userId}`);
            throw new Error('Unauthorized');
        }
        return this.usersService.updateDetails(userId, body.realName, body.email);
    }

    @Patch(':id/password')
    async updatePassword(@Param('id') id: string, @Body() body: { currentPass: string; newPass: string }, @Request() req) {
        console.log(`[UsersController] Update password request for ID ${id} from User ${req.user.userId}`);
        const userId = +id;
        // Password updates must always be self-initiated (unless we add an admin reset flow, which is different)
        if (req.user.userId !== userId) {
            console.error(`[UsersController] Unauthorized password update: User ${req.user.userId} trying to update ${userId}`);
            throw new Error('Unauthorized');
        }
        return this.usersService.updatePassword(userId, body.currentPass, body.newPass);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
        return this.usersService.update(+id, updateData);
    }
}
