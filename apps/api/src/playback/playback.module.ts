import { Body, Controller, Get, HttpCode, Module, Param, Post, UseGuards } from '@nestjs/common';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { AccountId, AuthGuard } from '../auth/auth.guard.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { PlaybackService } from './playback.service.js';

class StartPlaybackDto {
  @IsMongoId() profileId: string;
  @IsOptional() @IsString() episodeId?: string;
}

@Controller('playback')
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Get(':slug/trailer')
  trailer(@Param('slug') slug: string) {
    return this.playback.trailer(slug);
  }

  @Post(':slug')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  start(@AccountId() accountId: string, @Param('slug') slug: string, @Body() body: StartPlaybackDto) {
    return this.playback.start(accountId, body.profileId, slug, body.episodeId);
  }
}

@Module({
  imports: [CatalogModule, ProfilesModule],
  controllers: [PlaybackController],
  providers: [PlaybackService],
})
export class PlaybackModule {}
