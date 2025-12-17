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
        // If a userId is provided and the requester is a manager/admin, use that userId
        // Otherwise default to the requester's userId
        const targetUserId = (userId && (req.user.role === UserRole.MANAGER || req.user.role === UserRole.ADMIN))
            ? +userId
            : req.user.userId;

        // If user is manager and jobRoleId is provided (and they are looking at their own skills), filter by it
        if (req.user.role === UserRole.MANAGER && jobRoleId && targetUserId === req.user.userId) {
            return this.skillsService.findAllForManager(req.user.userId, +jobRoleId);
        }
        return this.skillsService.findAllForUser(targetUserId);
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
