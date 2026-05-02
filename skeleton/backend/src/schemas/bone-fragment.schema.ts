import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type Position = {
  x: number;
  y: number;
  z: number;
};

export type Rotation = {
  x: number;
  y: number;
  z: number;
};

export type Scale = {
  x: number;
  y: number;
  z: number;
};

@Schema()
export class BoneFragment {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object, required: true })
  targetPosition: Position;

  @Prop({ type: Object, required: true })
  targetRotation: Rotation;

  @Prop({ type: Object, default: { x: 1, y: 1, z: 1 } })
  targetScale: Scale;

  @Prop({ required: true })
  anatomyPosition: string;

  @Prop({ default: false })
  isExposed: boolean;

  @Prop({ default: false })
  isAssembled: boolean;

  @Prop({ default: 0 })
  damageLevel: number;

  @Prop({ type: Object })
  buriedPosition: Position;

  @Prop({ type: Object })
  buriedRotation: Rotation;

  @Prop()
  depth: number;
}

export const BoneFragmentSchema = SchemaFactory.createForClass(BoneFragment);
