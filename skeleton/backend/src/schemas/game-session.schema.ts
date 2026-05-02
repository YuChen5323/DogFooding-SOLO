import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Fossil } from './fossil.schema';

export type GameSessionDocument = GameSession & Document;

export enum GamePhase {
  EXCAVATION = 'excavation',
  ASSEMBLY = 'assembly',
  RECONSTRUCTION = 'reconstruction',
  MUSEUM = 'museum',
}

@Schema()
export class GameSession {
  @Prop({ required: true })
  playerId: string;

  @Prop({ type: Types.ObjectId, ref: 'Fossil', required: true })
  fossil: Fossil;

  @Prop({ type: String, enum: GamePhase, default: GamePhase.EXCAVATION })
  currentPhase: GamePhase;

  @Prop({ type: Map, of: String, default: {} })
  excavatedBones: Map<string, boolean>;

  @Prop({ type: Map, of: Object, default: {} })
  assembledBones: Map<string, { position: any; rotation: any; correct: boolean }>;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  damagePenalty: number;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);
