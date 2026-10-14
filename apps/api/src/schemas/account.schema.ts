import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Maturity } from './title.schema.js';

export const PLANS = ['basic', 'premium'] as const;
export type Plan = (typeof PLANS)[number];

@Schema({ timestamps: true })
export class Account {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true }) passwordHash: string;
  @Prop({ required: true, enum: PLANS, default: 'basic' }) plan: Plan;
  /** Mock billing state; a real system would mirror the payment provider. */
  @Prop() planRenewsAt?: Date;
}
export type AccountDocument = HydratedDocument<Account>;
export const AccountSchema = SchemaFactory.createForClass(Account);

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, required: true, index: true }) accountId: Types.ObjectId;
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, default: false }) kids: boolean;
  @Prop({ required: true }) avatarColor: string;
}
export type ProfileDocument = HydratedDocument<Profile>;
export const ProfileSchema = SchemaFactory.createForClass(Profile);

/** Highest maturity a kids profile may browse or play. */
export const KIDS_MAX_MATURITY: Maturity = '7+';

@Schema({ timestamps: true })
export class WatchlistItem {
  @Prop({ type: Types.ObjectId, required: true }) profileId: Types.ObjectId;
  @Prop({ required: true }) titleSlug: string;
}
export type WatchlistItemDocument = HydratedDocument<WatchlistItem>;
export const WatchlistItemSchema = SchemaFactory.createForClass(WatchlistItem);
WatchlistItemSchema.index({ profileId: 1, titleSlug: 1 }, { unique: true });
WatchlistItemSchema.index({ profileId: 1, createdAt: -1 });

/** Playback position for "continue watching". One row per profile and title. */
@Schema({ timestamps: true })
export class Progress {
  @Prop({ type: Types.ObjectId, required: true }) profileId: Types.ObjectId;
  @Prop({ required: true }) titleSlug: string;
  @Prop() episodeId?: string;
  @Prop({ required: true, min: 0 }) positionSec: number;
  @Prop({ required: true, min: 0 }) durationSec: number;
}
export type ProgressDocument = HydratedDocument<Progress>;
export const ProgressSchema = SchemaFactory.createForClass(Progress);
ProgressSchema.index({ profileId: 1, titleSlug: 1 }, { unique: true });
ProgressSchema.index({ profileId: 1, updatedAt: -1 });
