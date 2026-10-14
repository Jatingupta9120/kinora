import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { AccountId, AuthGuard } from '../auth/auth.guard.js';
import { ProfilesService } from './profiles.service.js';

class CreateProfileDto {
  @IsString() @Length(1, 20) name: string;
  @IsBoolean() kids: boolean;
}

class ProgressDto {
  @IsOptional() @IsString() episodeId?: string;
  @IsInt() @Min(0) @Max(60 * 60 * 6) positionSec: number;
  @IsInt() @Min(1) @Max(60 * 60 * 6) durationSec: number;
}

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  list(@AccountId() accountId: string) {
    return this.profiles.list(accountId);
  }

  @Post()
  create(@AccountId() accountId: string, @Body() body: CreateProfileDto) {
    return this.profiles.create(accountId, body.name, body.kids);
  }

  @Delete(':profileId')
  @HttpCode(204)
  async remove(@AccountId() accountId: string, @Param('profileId') profileId: string) {
    await this.profiles.remove(accountId, profileId);
  }

  /** `?slugs=a,b,c` — the titles currently on screen. */
  @Get(':profileId/overlay')
  overlay(@AccountId() accountId: string, @Param('profileId') profileId: string, @Query('slugs') slugs = '') {
    return this.profiles.overlay(accountId, profileId, slugs.split(',').filter(Boolean));
  }

  @Get(':profileId/watchlist')
  watchlist(@AccountId() accountId: string, @Param('profileId') profileId: string) {
    return this.profiles.getWatchlist(accountId, profileId);
  }

  @Put(':profileId/watchlist/:slug')
  add(@AccountId() accountId: string, @Param('profileId') profileId: string, @Param('slug') slug: string) {
    return this.profiles.addToWatchlist(accountId, profileId, slug);
  }

  @Delete(':profileId/watchlist/:slug')
  removeItem(@AccountId() accountId: string, @Param('profileId') profileId: string, @Param('slug') slug: string) {
    return this.profiles.removeFromWatchlist(accountId, profileId, slug);
  }

  @Get(':profileId/continue')
  continueWatching(@AccountId() accountId: string, @Param('profileId') profileId: string) {
    return this.profiles.continueWatching(accountId, profileId);
  }

  @Put(':profileId/progress/:slug')
  progress(
    @AccountId() accountId: string,
    @Param('profileId') profileId: string,
    @Param('slug') slug: string,
    @Body() body: ProgressDto,
  ) {
    return this.profiles.saveProgress(accountId, profileId, slug, body);
  }
}
