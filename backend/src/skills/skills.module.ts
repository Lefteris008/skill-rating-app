import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './skill.entity';
import { User } from '../users/user.entity';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Skill, User])],
    providers: [SkillsService],
    controllers: [SkillsController],
    exports: [SkillsService],
})
export class SkillsModule { }
