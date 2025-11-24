import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class JobRole {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;
}
