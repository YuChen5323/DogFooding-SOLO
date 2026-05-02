import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GameService, AssemblyCheckResult, ExcavationResult } from '../services/game.service';
import { GameSession } from '../schemas/game-session.schema';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('session')
  async createSession(
    @Body() body: { fossilId: string; playerId?: string },
  ): Promise<GameSession> {
    return this.gameService.createSession(body.fossilId, body.playerId);
  }

  @Get('session/:id')
  async getSession(@Param('id') sessionId: string): Promise<GameSession> {
    return this.gameService.getSession(sessionId);
  }

  @Post('excavation')
  async recordExcavation(
    @Body() body: { sessionId: string; boneId: string; damage: number },
  ): Promise<ExcavationResult> {
    return this.gameService.recordExcavation(
      body.sessionId,
      body.boneId,
      body.damage,
    );
  }

  @Post('assembly/check')
  async checkAssembly(
    @Body() body: {
      boneId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      targetPosition: { x: number; y: number; z: number };
      targetRotation: { x: number; y: number; z: number };
    },
  ): Promise<AssemblyCheckResult> {
    return this.gameService.checkAssembly(
      body.boneId,
      body.position,
      body.rotation,
      body.targetPosition,
      body.targetRotation,
    );
  }

  @Post('assembly/record')
  async recordAssembly(
    @Body() body: {
      sessionId: string;
      boneId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      isCorrect: boolean;
    },
  ): Promise<GameSession> {
    return this.gameService.recordAssembly(
      body.sessionId,
      body.boneId,
      body.position,
      body.rotation,
      body.isCorrect,
    );
  }

  @Post('session/:id/advance')
  async advancePhase(@Param('id') sessionId: string): Promise<GameSession> {
    return this.gameService.advancePhase(sessionId);
  }
}
