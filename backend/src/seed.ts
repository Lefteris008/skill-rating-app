import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SkillsService } from './skills/skills.service';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const skillsService = app.get(SkillsService);

    // Create Users with realName and email
    const admin = await usersService.create({
        username: 'admin',
        password: 'admin',
        role: UserRole.ADMIN,
        realName: 'Administrator',
        email: 'admin@example.com'
    });

    const manager1 = await usersService.create({
        username: 'manager1',
        password: 'manager1',
        role: UserRole.MANAGER,
        realName: 'Manager One',
        email: 'manager1@example.com'
    });

    const manager2 = await usersService.create({
        username: 'manager2',
        password: 'manager2',
        role: UserRole.MANAGER,
        realName: 'Manager Two',
        email: 'manager2@example.com'
    });

    const employee1 = await usersService.create({
        username: 'employee1',
        password: 'employee1',
        role: UserRole.EMPLOYEE,
        realName: 'Employee One',
        email: 'employee1@example.com'
    });

    const employee2 = await usersService.create({
        username: 'employee2',
        password: 'employee2',
        role: UserRole.EMPLOYEE,
        realName: 'Employee Two',
        email: 'employee2@example.com'
    });

    console.log('Created Users:', {
        admin: admin.username,
        manager1: manager1.username,
        manager2: manager2.username,
        employee1: employee1.username,
        employee2: employee2.username
    });

    // Assign employees to managers
    await usersService.assignManager(employee1.id, manager1.id);
    await usersService.assignManager(employee2.id, manager2.id);

    console.log('Assigned employees to managers');

    // Create Skills for Manager 1
    await skillsService.create({ name: 'Angular', targetLevel: 75 }, manager1.id);
    await skillsService.create({ name: 'TypeScript', targetLevel: 80 }, manager1.id);
    await skillsService.create({ name: 'RxJS', targetLevel: 70 }, manager1.id);

    // Create Skills for Manager 2
    await skillsService.create({ name: 'NestJS', targetLevel: 85 }, manager2.id);
    await skillsService.create({ name: 'Node.js', targetLevel: 80 }, manager2.id);
    await skillsService.create({ name: 'PostgreSQL', targetLevel: 75 }, manager2.id);

    console.log('Created Skills for both managers');

    await app.close();
}
bootstrap();
