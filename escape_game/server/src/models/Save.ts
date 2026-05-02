import mongoose, { Document, Schema } from 'mongoose';

export interface IGameState {
  currentRoom: string;
  inventory: string[];
  flags: Record<string, boolean>;
  puzzlesSolved: string[];
  achievementsUnlocked: string[];
  diaryEntries: string[];
  playerPosition: {
    x: number;
    y: number;
  };
  playTime: number;
  lastSaved: Date;
}

export interface ISave extends Document {
  userId: mongoose.Types.ObjectId;
  slotNumber: number;
  gameState: IGameState;
  createdAt: Date;
  updatedAt: Date;
}

const gameStateSchema: Schema = new Schema({
  currentRoom: { type: String, default: 'start' },
  inventory: { type: [String], default: [] },
  flags: { type: Schema.Types.Mixed, default: {} },
  puzzlesSolved: { type: [String], default: [] },
  achievementsUnlocked: { type: [String], default: [] },
  diaryEntries: { type: [String], default: [] },
  playerPosition: {
    x: { type: Number, default: 400 },
    y: { type: Number, default: 450 }
  },
  playTime: { type: Number, default: 0 },
  lastSaved: { type: Date, default: Date.now }
});

const saveSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slotNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  gameState: {
    type: gameStateSchema,
    required: true
  }
}, {
  timestamps: true
});

saveSchema.index({ userId: 1, slotNumber: 1 }, { unique: true });

export default mongoose.model<ISave>('Save', saveSchema);
