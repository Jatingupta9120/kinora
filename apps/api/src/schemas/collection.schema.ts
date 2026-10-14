import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** A merchandised rail: an ordered list of title slugs shown on a page. */
@Schema()
export class Collection {
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, enum: ['hero', 'rail', 'top10'] }) style: 'hero' | 'rail' | 'top10';
  /** Pages this rail appears on, e.g. `home`, `movies`, `tv`. */
  @Prop({ type: [String], index: true }) pages: string[];
  @Prop({ required: true }) order: number;
  @Prop({ type: [String], required: true }) titleSlugs: string[];
}

export type CollectionDocument = HydratedDocument<Collection>;
export const CollectionSchema = SchemaFactory.createForClass(Collection);
