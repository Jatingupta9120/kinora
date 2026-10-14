import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  accountId: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Sign in required');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.accountId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Session expired');
    }
  }
}

export const AccountId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => ctx.switchToHttp().getRequest<AuthedRequest>().accountId,
);
