import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Account, AccountSchema, Profile, ProfileSchema, Progress, ProgressSchema,
  WatchlistItem, WatchlistItemSchema,
} from '../schemas/account.schema.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

/** Global so every feature module can use AuthGuard and the account-side models. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: Profile.name, schema: ProfileSchema },
      { name: WatchlistItem.name, schema: WatchlistItemSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, JwtModule, MongooseModule],
})
export class AuthModule {}
