import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobRole } from './job-role.entity';

@Injectable()
export class JobRolesService {
    constructor(
        @InjectRepository(JobRole)
        private jobRolesRepository: Repository<JobRole>,
    ) { }

    async create(name: string): Promise<JobRole> {
        const role = this.jobRolesRepository.create({ name });
        return this.jobRolesRepository.save(role);
    }

    async findAll(): Promise<JobRole[]> {
        return this.jobRolesRepository.find();
    }

    async remove(id: number): Promise<void> {
        await this.jobRolesRepository.delete(id);
    }
}
