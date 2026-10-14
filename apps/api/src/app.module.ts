import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PlaybackModule } from './playback/playback.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { SubscriptionModule } from './subscription/subscription.module.js';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/kinora'),
      }),
    }),
    AuthModule,
    CatalogModule,
    ProfilesModule,
    SubscriptionModule,
    PlaybackModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
