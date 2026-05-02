import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameSession, GameSessionDocument, GamePhase } from '../schemas/game-session.schema';
import { Fossil, FossilDocument } from '../schemas/fossil.schema';
import { BoneFragment } from '../schemas/bone-fragment.schema';

export type AssemblyCheckResult = {
  isCorrect: boolean;
  positionAccuracy: number;
  rotationAccuracy: number;
  feedback: string;
};

export type ExcavationResult = {
  success: boolean;
  damage: number;
  bone: BoneFragment;
};

@Injectable()
export class GameService {
  constructor(
    @InjectModel('GameSession') private gameSessionModel: Model<GameSessionDocument>,
    @InjectModel('Fossil') private fossilModel: Model<FossilDocument>,
  ) {}

  async createSession(fossilId: string, playerId: string = 'anonymous'): Promise<GameSession> {
    const fossil = await this.fossilModel.findById(fossilId).populate('bones').exec();
    
    if (!fossil) {
      throw new Error('Fossil not found');
    }

    const newSession = new this.gameSessionModel({
      playerId,
      fossil: fossil._id,
      currentPhase: GamePhase.EXCAVATION,
      excavatedBones: new Map(),
      assembledBones: new Map(),
      score: 0,
      damagePenalty: 0,
      isCompleted: false,
    });

    return newSession.save();
  }

  async getSession(sessionId: string): Promise<GameSession> {
    return this.gameSessionModel
      .findById(sessionId)
      .populate('fossil')
      .exec();
  }

  async recordExcavation(
    sessionId: string, 
    boneId: string, 
    damage: number
  ): Promise<ExcavationResult> {
    const session = await this.gameSessionModel.findById(sessionId).exec();
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (damage > 0.5) {
      session.damagePenalty += damage * 10;
    }

    session.excavatedBones.set(boneId, true);
    session.score += Math.max(0, 100 - damage * 100);

    await session.save();

    const fossil = await this.fossilModel
      .findById(session.fossil)
      .populate('bones')
      .exec();
    
    const bone = fossil.bones.find(b => b.id === boneId);

    return {
      success: damage < 0.5,
      damage,
      bone,
    };
  }

  async checkAssembly(
    boneId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number },
    targetRotation: { x: number; y: number; z: number },
  ): Promise<AssemblyCheckResult> {
    const positionThreshold = 0.5;
    const rotationThreshold = 0.3;

    const positionDistance = Math.sqrt(
      Math.pow(position.x - targetPosition.x, 2) +
      Math.pow(position.y - targetPosition.y, 2) +
      Math.pow(position.z - targetPosition.z, 2)
    );

    const rotationDistance = Math.sqrt(
      Math.pow(this.normalizeAngle(rotation.x - targetRotation.x), 2) +
      Math.pow(this.normalizeAngle(rotation.y - targetRotation.y), 2) +
      Math.pow(this.normalizeAngle(rotation.z - targetRotation.z), 2)
    );

    const positionAccuracy = Math.max(0, 100 - positionDistance * 20);
    const rotationAccuracy = Math.max(0, 100 - rotationDistance * 30);

    const isCorrect = positionDistance < positionThreshold && rotationDistance < rotationThreshold;

    let feedback = '';
    if (isCorrect) {
      feedback = '完美！骨骼已正确放置。';
    } else if (positionDistance > positionThreshold) {
      feedback = '位置需要调整。';
    } else {
      feedback = '旋转角度需要调整。';
    }

    return {
      isCorrect,
      positionAccuracy,
      rotationAccuracy,
      feedback,
    };
  }

  async recordAssembly(
    sessionId: string,
    boneId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    isCorrect: boolean,
  ): Promise<GameSession> {
    const session = await this.gameSessionModel.findById(sessionId).exec();
    
    if (!session) {
      throw new Error('Session not found');
    }

    session.assembledBones.set(boneId, {
      position,
      rotation,
      correct: isCorrect,
    });

    if (isCorrect) {
      session.score += 200;
    }

    const fossil = await this.fossilModel
      .findById(session.fossil)
      .populate('bones')
      .exec();

    const allAssembled = fossil.bones.every(bone => 
      session.assembledBones.has(bone.id) && 
      session.assembledBones.get(bone.id).correct
    );

    if (allAssembled) {
      session.currentPhase = GamePhase.RECONSTRUCTION;
    }

    return session.save();
  }

  async advancePhase(sessionId: string): Promise<GameSession> {
    const session = await this.gameSessionModel.findById(sessionId).exec();
    
    if (!session) {
      throw new Error('Session not found');
    }

    const phases = [
      GamePhase.EXCAVATION,
      GamePhase.ASSEMBLY,
      GamePhase.RECONSTRUCTION,
      GamePhase.MUSEUM,
    ];

    const currentIndex = phases.indexOf(session.currentPhase);
    if (currentIndex < phases.length - 1) {
      session.currentPhase = phases[currentIndex + 1];
      
      if (session.currentPhase === GamePhase.MUSEUM) {
        session.isCompleted = true;
      }

      return session.save();
    }

    return session;
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return Math.abs(angle);
  }
}
