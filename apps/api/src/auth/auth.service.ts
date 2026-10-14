import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { Account, Profile } from '../schemas/account.schema.js';

const AVATAR_COLORS = ['#1a98ff', '#f25f5c', '#ffb703', '#2ec4b6', '#9b5de5'];

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.accounts.exists({ email: email.toLowerCase() });
    if (existing) throw new ConflictException('An account with that email already exists');
    const account = await this.accounts.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      plan: 'basic',
    });
    const name = email.split('@')[0].slice(0, 20) || 'Me';
    await this.profiles.create({ accountId: account._id, name, kids: false, avatarColor: AVATAR_COLORS[0] });
    return this.issue(account._id.toString());
  }

  async login(email: string, password: string) {
    const account = await this.accounts.findOne({ email: email.toLowerCase() });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    return this.issue(account._id.toString());
  }

  async me(accountId: string) {
    const account = await this.accounts.findById(accountId).lean();
    if (!account) throw new NotFoundException('Account not found');
    return { email: account.email, plan: account.plan, planRenewsAt: account.planRenewsAt ?? null };
  }

  private async issue(accountId: string) {
    return { token: await this.jwt.signAsync({ sub: accountId }) };
  }
}

export { AVATAR_COLORS };
