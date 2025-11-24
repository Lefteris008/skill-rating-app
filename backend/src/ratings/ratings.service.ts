import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';

@Injectable()
export class RatingsService {
    constructor(
        @InjectRepository(Rating)
        private ratingsRepository: Repository<Rating>,
    ) { }

    async createOrUpdateSelfRating(userId: number, skillId: number, ratingValue: number): Promise<Rating> {
        let rating = await this.ratingsRepository.findOne({
            where: { user: { id: userId }, skill: { id: skillId } },
        });

        if (!rating) {
            rating = this.ratingsRepository.create({
                user: { id: userId },
                skill: { id: skillId },
                selfRating: ratingValue,
            });
        } else {
            rating.selfRating = ratingValue;
        }

        return this.ratingsRepository.save(rating);
    }

    async createOrUpdateManagerRating(subordinateId: number, skillId: number, ratingValue: number): Promise<Rating> {
        let rating = await this.ratingsRepository.findOne({
            where: { user: { id: subordinateId }, skill: { id: skillId } },
        });

        if (!rating) {
            rating = this.ratingsRepository.create({
                user: { id: subordinateId },
                skill: { id: skillId },
                managerRating: ratingValue,
            });
        } else {
            rating.managerRating = ratingValue;
        }

        return this.ratingsRepository.save(rating);
    }

    async setTargetRating(userId: number, skillId: number, ratingValue: number): Promise<Rating> {
        let rating = await this.ratingsRepository.findOne({
            where: { user: { id: userId }, skill: { id: skillId } },
        });

        if (!rating) {
            rating = this.ratingsRepository.create({
                user: { id: userId },
                skill: { id: skillId },
                targetRating: ratingValue,
            });
        } else {
            rating.targetRating = ratingValue;
        }

        return this.ratingsRepository.save(rating);
    }

    async finalizeRatings(subordinateId: number): Promise<void> {
        await this.ratingsRepository.update({ user: { id: subordinateId } }, { isFinalized: true });
    }

    async getRatingsForUser(userId: number): Promise<Rating[]> {
        const ratings = await this.ratingsRepository.find({
            where: { user: { id: userId } },
            relations: ['skill'],
        });

        return ratings.map(r => {
            if (!r.isFinalized) {
                // Hide manager rating if not finalized
                const { managerRating, ...rest } = r;
                return rest as Rating;
            }
            return r;
        });
    }

    async getRatingsForManager(subordinateId: number): Promise<Rating[]> {
        return this.ratingsRepository.find({
            where: { user: { id: subordinateId } },
            relations: ['skill'],
        });
    }

    async getFinalizedUserIds(): Promise<number[]> {
        const ratings = await this.ratingsRepository.find({
            where: { isFinalized: true },
            select: ['user'],
            relations: ['user'],
        });
        // Return unique user IDs
        return [...new Set(ratings.map(r => r.user.id))];
    }
}
