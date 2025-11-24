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

    @Patch(':id/assign-manager')
    @Roles(UserRole.ADMIN)
    assignManager(@Param('id') id: string, @Body() body: { managerId: number | null }): Promise<User> {
        return this.usersService.assignManager(+id, body.managerId);
    }

    @Get('my-team')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    getMyTeam(@Request() req): Promise<User[]> {
        return this.usersService.getTeamMembers(req.user.userId);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
        return this.usersService.update(+id, updateData);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    delete(@Param('id') id: string): Promise<void> {
        return this.usersService.delete(+id);
    }

    @Patch(':id/roles')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    assignRoles(
        @Param('id') id: string,
        @Body() body: { currentRoleId: number; targetRoleId: number },
    ) {
        return this.usersService.assignRoles(+id, body.currentRoleId, body.targetRoleId);
    }
}
