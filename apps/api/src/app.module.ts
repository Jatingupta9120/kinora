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
        // Hosted URIs (e.g. Atlas via Vercel) often carry no database name; pick one explicitly.
        dbName: config.get<string>('MONGODB_DB', 'kinora'),
        // Serverless: fail fast with a logged error instead of retrying past the platform's startup limit.
        serverSelectionTimeoutMS: 8_000,
        retryAttempts: 2,
        retryDelay: 1_000,
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
