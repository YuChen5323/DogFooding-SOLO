import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BoneFragment } from './bone-fragment.schema';

export type FossilDocument = Fossil & Document;

@Schema()
export class Fossil {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  species: string;

  @Prop()
  period: string;

  @Prop()
  description: string;

  @Prop()
  difficulty: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'BoneFragment' }] })
  bones: BoneFragment[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FossilSchema = SchemaFactory.createForClass(Fossil);
