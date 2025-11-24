import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRole } from './job-role.entity';
import { JobRolesService } from './job-roles.service';
import { JobRolesController } from './job-roles.controller';

@Module({
    imports: [TypeOrmModule.forFeature([JobRole])],
    providers: [JobRolesService],
    controllers: [JobRolesController],
    exports: [JobRolesService],
})
export class JobRolesModule { }
