import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { JobRole } from '../roles/job-role.entity';

@Entity()
export class Skill {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'integer', default: 0 })
    targetLevel: number; // Target level for next role (0-100)

    @ManyToOne(() => User, { nullable: false })
    manager: User;

    @ManyToOne(() => JobRole, { nullable: true })
    jobRole: JobRole;

    @Column({ nullable: true })
    jobRoleId: number;
}
