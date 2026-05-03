import axios from 'axios'
import { Move, Joseki, JosekiCategory, AIRecommendation, GameAnalysis, GameRecord } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const katagoApi = {
  async getAnalysis(
    boardSize: number,
    moves: Move[],
    komi: number = 6.5
  ): Promise<{
    winRate: number
    scoreLead: number
    scoreStdev: number
    moves: AIRecommendation[]
  }> {
    const response = await api.post('/katago/analyze', {
      boardSize,
      moves: moves.map(m => ({
        position: m.position,
        color: m.color,
        isPass: m.isPass,
      })),
      komi,
    })
    return response.data
  },

  async getNextMove(
    boardSize: number,
    moves: Move[],
    komi: number = 6.5
  ): Promise<AIRecommendation> {
    const response = await api.post('/katago/next-move', {
      boardSize,
      moves: moves.map(m => ({
        position: m.position,
        color: m.color,
        isPass: m.isPass,
      })),
      komi,
    })
    return response.data
  },
}

export const josekiApi = {
  async getCategories(): Promise<JosekiCategory[]> {
    const response = await api.get('/joseki/categories')
    return response.data
  },

  async getJosekiByCategory(categoryId: string): Promise<Joseki[]> {
    const response = await api.get(`/joseki/category/${categoryId}`)
    return response.data
  },

  async searchJoseki(query: string): Promise<Joseki[]> {
    const response = await api.get('/joseki/search', {
      params: { q: query },
    })
    return response.data
  },

  async getJoseki(id: string): Promise<Joseki> {
    const response = await api.get(`/joseki/${id}`)
    return response.data
  },

  async getRandomJoseki(difficulty?: string): Promise<Joseki> {
    const response = await api.get('/joseki/random', {
      params: { difficulty },
    })
    return response.data
  },
}

export const gameRecordApi = {
  async saveGameRecord(record: Omit<GameRecord, 'id' | 'date'>): Promise<GameRecord> {
    const response = await api.post('/game-records', record)
    return response.data
  },

  async getGameRecords(): Promise<GameRecord[]> {
    const response = await api.get('/game-records')
    return response.data
  },

  async getGameRecord(id: string): Promise<GameRecord> {
    const response = await api.get(`/game-records/${id}`)
    return response.data
  },

  async analyzeGameRecord(id: string): Promise<GameAnalysis> {
    const response = await api.post(`/game-records/${id}/analyze`)
    return response.data
  },
}

export default api
