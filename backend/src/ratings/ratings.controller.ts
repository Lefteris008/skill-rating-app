import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('ratings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) { }

    @Post('self')
    async rateSelf(@Request() req, @Body() body: { skillId: number; rating: number }) {
        return this.ratingsService.createOrUpdateSelfRating(req.user.userId, body.skillId, body.rating);
    }

    @Post('manager/:subordinateId')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    async rateSubordinate(
        @Param('subordinateId') subordinateId: string,
        @Body() body: { skillId: number; rating: number },
    ) {
        return this.ratingsService.createOrUpdateManagerRating(+subordinateId, body.skillId, body.rating);
    }

    @Post('target/:userId')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async setTarget(
        @Param('userId') userId: string,
        @Body() body: { skillId: number; rating: number },
    ) {
        return this.ratingsService.setTargetRating(+userId, body.skillId, body.rating);
    }

    @Post('finalize/:subordinateId')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    async finalize(@Param('subordinateId') subordinateId: string) {
        return this.ratingsService.finalizeRatings(+subordinateId);
    }

    @Get('finalized-users')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    async getFinalizedUsers() {
        return this.ratingsService.getFinalizedUserIds();
    }

    @Get('my-ratings')
    async getMyRatings(@Request() req) {
        return this.ratingsService.getRatingsForUser(req.user.userId);
    }

    @Get('subordinate/:subordinateId')
    @Roles(UserRole.MANAGER, UserRole.ADMIN)
    async getSubordinateRatings(@Param('subordinateId') subordinateId: string) {
        return this.ratingsService.getRatingsForManager(+subordinateId);
    }

    @Get(':userId')
    async getRatingsByUser(@Param('userId') userId: string) {
        return this.ratingsService.getRatingsForUser(+userId);
    }
}
