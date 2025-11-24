import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Skill } from '../skills/skill.entity';

@Entity()
export class Rating {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
    skill: Skill;

    @Column({ type: 'int', nullable: true })
    selfRating: number;

    @Column({ type: 'int', nullable: true })
    managerRating: number;

    @Column({ type: 'int', nullable: true })
    targetRating: number;

    @Column({ default: false })
    isFinalized: boolean;
}
