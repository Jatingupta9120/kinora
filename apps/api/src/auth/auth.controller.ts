import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AccountId, AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

class CredentialsDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: CredentialsDto) {
    return this.auth.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: CredentialsDto) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@AccountId() accountId: string) {
    return this.auth.me(accountId);
  }
}
