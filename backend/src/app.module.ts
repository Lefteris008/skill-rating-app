import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SkillsModule } from './skills/skills.module';
import { RatingsModule } from './ratings/ratings.module';
import { JobRolesModule } from './roles/job-roles.module';
import { User } from './users/user.entity';
import { Skill } from './skills/skill.entity';
import { Rating } from './ratings/rating.entity';
import { JobRole } from './roles/job-role.entity';

import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Skill, Rating, JobRole],
      synchronize: true, // Only for dev
    }),
    AuthModule,
    UsersModule,
    SkillsModule,
    RatingsModule,
    JobRolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
