import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Skill } from './skill.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('skills')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SkillsController {
    constructor(private readonly skillsService: SkillsService) { }

    @Post()
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    create(@Body() body: { skill: Partial<Skill>, jobRoleId?: number }, @Request() req) {
        // Handle both old format (direct skill object) and new format (nested skill + jobRoleId)
        const skillData = body.skill || body;
        const jobRoleId = body.jobRoleId;
        return this.skillsService.create(skillData, req.user.userId, jobRoleId);
    }

    @Get()
    async findAll(@Request() req, @Query('jobRoleId') jobRoleId?: string, @Query('userId') userId?: string) {
        const currentUserId = +req.user.userId;
        const targetUserId = (userId && (req.user.role === UserRole.MANAGER || req.user.role === 'manager' || req.user.role === UserRole.ADMIN))
            ? +userId
            : currentUserId;

        console.log(`findAll: requester=${currentUserId} role=${req.user.role} jobRoleId=${jobRoleId} targetUserId=${targetUserId}`);

        // If user is manager and jobRoleId is provided, filter by it
        // We relax the targetUserId check: if I am a manager and I ask for jobRoleId, I probably mean *my* skills filtered by role (since creating skills is a manager task).
        // Or if I am looking at another user but filtering by role... that's less common for this specific 'manage skills' view.
        // The 'Manage Skills' view definitely hits this with NO userId param. So targetUserId == currentUserId.

        const isManager = req.user.role === UserRole.MANAGER || req.user.role === 'manager';

        // Use loose equality or explicit cast for safety
        if (isManager && jobRoleId !== undefined && targetUserId === currentUserId) {
            console.log('Fulfilling manager request with explicit role filter');
            const parsedRoleId = jobRoleId === 'null' ? null : +jobRoleId;
            return this.skillsService.findAllForManager(currentUserId, parsedRoleId);
        }

        console.log('Falling back to default user lookup');
        const parsedRoleId = jobRoleId === 'null' ? null : (jobRoleId !== undefined ? +jobRoleId : undefined);
        return this.skillsService.findAllForUser(targetUserId, parsedRoleId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.skillsService.findOne(+id, req.user.userId);
    }

    @Patch(':id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() skill: Partial<Skill>, @Request() req) {
        return this.skillsService.update(+id, skill, req.user.userId);
    }

    @Delete(':id')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    remove(@Param('id') id: string, @Request() req) {
        return this.skillsService.remove(+id, req.user.userId);
    }
}
