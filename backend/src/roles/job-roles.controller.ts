import { Controller, Get, Post, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { JobRolesService } from './job-roles.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('job-roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobRolesController {
    constructor(private readonly jobRolesService: JobRolesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body('name') name: string) {
        return this.jobRolesService.create(name);
    }

    @Get()
    findAll() {
        return this.jobRolesService.findAll();
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.jobRolesService.remove(+id);
    }
}
