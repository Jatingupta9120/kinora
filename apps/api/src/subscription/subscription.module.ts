import { Body, Controller, Get, Injectable, Module, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsIn } from 'class-validator';
import { Model } from 'mongoose';
import { AccountId, AuthGuard } from '../auth/auth.guard.js';
import { Account, PLANS, type Plan } from '../schemas/account.schema.js';

export const PLAN_CATALOG: Record<Plan, { name: string; priceMonthly: number; currency: string; perks: string[] }> = {
  basic: {
    name: 'Kinora Free', priceMonthly: 0, currency: 'USD',
    perks: ['Free-to-watch movies and series', 'Up to 5 profiles', 'Watchlist and continue watching'],
  },
  premium: {
    name: 'Kinora Premium', priceMonthly: 7.99, currency: 'USD',
    perks: ['Everything in Free', 'All premium originals and new releases', 'Highest available quality'],
  },
};

class ChangePlanDto {
  @IsIn(PLANS) plan: Plan;
}

/**
 * Mock billing. A real implementation would create a checkout session with a payment
 * provider and update the plan from its webhook, never directly from the client.
 */
@Injectable()
export class SubscriptionService {
  constructor(@InjectModel(Account.name) private readonly accounts: Model<Account>) {}

  async get(accountId: string) {
    const account = await this.accounts.findById(accountId, { plan: 1, planRenewsAt: 1 }).lean();
    if (!account) throw new NotFoundException('Account not found');
    return { plan: account.plan, renewsAt: account.planRenewsAt ?? null, plans: PLAN_CATALOG };
  }

  async change(accountId: string, plan: Plan) {
    const renewsAt = plan === 'premium' ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : undefined;
    await this.accounts.updateOne(
      { _id: accountId },
      renewsAt ? { $set: { plan, planRenewsAt: renewsAt } } : { $set: { plan }, $unset: { planRenewsAt: 1 } },
    );
    return this.get(accountId);
  }
}

@Controller('subscription')
@UseGuards(AuthGuard)
export class SubscriptionController {
  constructor(private readonly subs: SubscriptionService) {}

  @Get()
  get(@AccountId() accountId: string) {
    return this.subs.get(accountId);
  }

  @Put()
  change(@AccountId() accountId: string, @Body() body: ChangePlanDto) {
    return this.subs.change(accountId, body.plan);
  }
}

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
