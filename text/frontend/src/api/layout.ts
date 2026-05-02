import service from './index'
import type { Layout, CharacterGlyph, ApiResponse } from '@/types'

export const layoutApi = {
  getGlyphs: (): Promise<ApiResponse<CharacterGlyph[]>> => {
    return service.get('/glyphs').then(res => res.data)
  },

  getGlyphsByRadical: (radical: string): Promise<ApiResponse<CharacterGlyph[]>> => {
    return service.get(`/glyphs/radical/${radical}`).then(res => res.data)
  },

  getGlyphsByStrokeCount: (count: number): Promise<ApiResponse<CharacterGlyph[]>> => {
    return service.get(`/glyphs/stroke/${count}`).then(res => res.data)
  },

  saveLayout: (layout: Layout): Promise<ApiResponse<{ id: string }>> => {
    return service.post('/layouts', layout).then(res => res.data)
  },

  getLayout: (id: string): Promise<ApiResponse<Layout>> => {
    return service.get(`/layouts/${id}`).then(res => res.data)
  },

  getLayouts: (): Promise<ApiResponse<Layout[]>> => {
    return service.get('/layouts').then(res => res.data)
  },

  updateLayout: (id: string, layout: Partial<Layout>): Promise<ApiResponse> => {
    return service.put(`/layouts/${id}`, layout).then(res => res.data)
  },

  deleteLayout: (id: string): Promise<ApiResponse> => {
    return service.delete(`/layouts/${id}`).then(res => res.data)
  },

  exportLayout: (id: string, format: 'png' | 'svg' | 'pdf'): Promise<Blob> => {
    return service.get(`/layouts/${id}/export`, {
      params: { format },
      responseType: 'blob'
    }).then(res => res.data)
  }
}
