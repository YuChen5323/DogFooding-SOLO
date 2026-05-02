import axios from 'axios';
import { Fossil, GameSession, AssemblyCheckResult, ExcavationResult } from '../types';

const API_BASE_URL = '/api';

export const fossilApi = {
  getAll: async (): Promise<Fossil[]> => {
    const response = await axios.get<Fossil[]>(`${API_BASE_URL}/fossils`);
    return response.data;
  },

  getById: async (id: string): Promise<Fossil> => {
    const response = await axios.get<Fossil>(`${API_BASE_URL}/fossils/${id}`);
    return response.data;
  },

  create: async (fossilData: Partial<Fossil>): Promise<Fossil> => {
    const response = await axios.post<Fossil>(`${API_BASE_URL}/fossils`, fossilData);
    return response.data;
  },

  initialize: async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/fossils/init`);
  },
};

export const gameApi = {
  createSession: async (fossilId: string, playerId: string = 'anonymous'): Promise<GameSession> => {
    const response = await axios.post<GameSession>(`${API_BASE_URL}/game/session`, {
      fossilId,
      playerId,
    });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<GameSession> => {
    const response = await axios.get<GameSession>(`${API_BASE_URL}/game/session/${sessionId}`);
    return response.data;
  },

  recordExcavation: async (
    sessionId: string,
    boneId: string,
    damage: number
  ): Promise<ExcavationResult> => {
    const response = await axios.post<ExcavationResult>(`${API_BASE_URL}/game/excavation`, {
      sessionId,
      boneId,
      damage,
    });
    return response.data;
  },

  checkAssembly: async (
    boneId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number },
    targetRotation: { x: number; y: number; z: number }
  ): Promise<AssemblyCheckResult> => {
    const response = await axios.post<AssemblyCheckResult>(
      `${API_BASE_URL}/game/assembly/check`,
      {
        boneId,
        position,
        rotation,
        targetPosition,
        targetRotation,
      }
    );
    return response.data;
  },

  recordAssembly: async (
    sessionId: string,
    boneId: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    isCorrect: boolean
  ): Promise<GameSession> => {
    const response = await axios.post<GameSession>(`${API_BASE_URL}/game/assembly/record`, {
      sessionId,
      boneId,
      position,
      rotation,
      isCorrect,
    });
    return response.data;
  },

  advancePhase: async (sessionId: string): Promise<GameSession> => {
    const response = await axios.post<GameSession>(
      `${API_BASE_URL}/game/session/${sessionId}/advance`
    );
    return response.data;
  },
};
