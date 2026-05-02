import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { GameState } from '../types/game';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async register(username: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getSaves() {
    const response = await this.api.get('/saves');
    return response.data;
  }

  async getSave(slotNumber: number) {
    const response = await this.api.get(`/saves/${slotNumber}`);
    return response.data;
  }

  async saveGame(slotNumber: number, gameState: GameState) {
    const response = await this.api.post(`/saves/${slotNumber}`, {
      gameState,
    });
    return response.data;
  }

  async deleteSave(slotNumber: number) {
    const response = await this.api.delete(`/saves/${slotNumber}`);
    return response.data;
  }

  async getAchievements() {
    const response = await this.api.get('/achievements');
    return response.data;
  }

  async unlockAchievement(achievementId: string) {
    const response = await this.api.post('/achievements/unlock', {
      achievementId,
    });
    return response.data;
  }

  async getAchievementDefinitions() {
    const response = await this.api.get('/achievements/definitions');
    return response.data;
  }

  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();
