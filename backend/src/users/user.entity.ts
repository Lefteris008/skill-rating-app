import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { JobRole } from '../roles/job-role.entity';

export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    EMPLOYEE = 'employee',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    realName: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; // Hashed

    @Column({
        type: 'simple-enum',
        enum: UserRole,
        default: UserRole.EMPLOYEE,
    })
    role: UserRole;

    @ManyToOne(() => User, (user) => user.subordinates, { nullable: true })
    manager: User;

    @OneToMany(() => User, (user) => user.manager)
    subordinates: User[];

    @ManyToOne(() => JobRole, { nullable: true })
    currentRole: JobRole;

    @ManyToOne(() => JobRole, { nullable: true })
    targetRole: JobRole;
}
