import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { MATURITY, TIERS, type Maturity, type Tier } from '../common/ratings.js';

export { MATURITY, TIERS, type Maturity, type Tier };

@Schema({ _id: false })
export class Episode {
  @Prop({ required: true }) id: string;
  @Prop({ required: true }) number: number;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) synopsis: string;
  @Prop({ required: true }) durationMin: number;
  @Prop({ required: true }) mediaId: string;
}

@Schema({ _id: false })
export class Season {
  @Prop({ required: true }) number: number;
  @Prop({ type: [Episode], default: [] }) episodes: Episode[];
}

@Schema({ timestamps: true })
export class Title {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, enum: ['movie', 'series'] }) kind: 'movie' | 'series';
  @Prop({ required: true }) synopsis: string;
  @Prop({ required: true }) tagline: string;
  @Prop({ required: true }) year: number;
  @Prop({ type: [String], index: true }) genres: string[];
  @Prop({ type: [String], default: [] }) cast: string[];
  @Prop({ type: [String], default: [] }) directors: string[];
  @Prop({ required: true, enum: MATURITY }) maturity: Maturity;
  @Prop({ required: true, enum: TIERS }) tier: Tier;
  /** Two hex colours used to render original gradient artwork (no third-party images). */
  @Prop({ type: [String], required: true }) palette: [string, string];
  @Prop() badge?: string;
  @Prop({ default: 0 }) popularity: number;
  /** Movies: runtime. Series: typical episode length. */
  @Prop() durationMin?: number;
  /** Key into the media registry; resolved to a manifest only by the playback service. */
  @Prop() mediaId?: string;
  @Prop() trailerMediaId?: string;
  @Prop({ type: [Season], default: [] }) seasons: Season[];
}

export type TitleDocument = HydratedDocument<Title>;
export const TitleSchema = SchemaFactory.createForClass(Title);
TitleSchema.index(
  { name: 'text', tagline: 'text', cast: 'text', directors: 'text', genres: 'text', synopsis: 'text' },
  { weights: { name: 10, cast: 4, directors: 4, genres: 3, tagline: 2, synopsis: 1 }, name: 'title_text' },
);
TitleSchema.index({ name: 1 });
