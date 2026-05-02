import axios from 'axios';
import type { KeyboardLayout, ComponentLibrary, FirmwareConfig } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const layoutApi = {
  getAll: async (): Promise<KeyboardLayout[]> => {
    try {
      const response = await api.get('/layouts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch layouts:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<KeyboardLayout | null> => {
    try {
      const response = await api.get(`/layouts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch layout ${id}:`, error);
      return null;
    }
  },

  create: async (layout: KeyboardLayout): Promise<KeyboardLayout | null> => {
    try {
      const response = await api.post('/layouts', layout);
      return response.data;
    } catch (error) {
      console.error('Failed to create layout:', error);
      return null;
    }
  },

  update: async (id: string, layout: Partial<KeyboardLayout>): Promise<KeyboardLayout | null> => {
    try {
      const response = await api.put(`/layouts/${id}`, layout);
      return response.data;
    } catch (error) {
      console.error(`Failed to update layout ${id}:`, error);
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/layouts/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete layout ${id}:`, error);
      return false;
    }
  },
};

export const componentApi = {
  getLibrary: async (): Promise<ComponentLibrary | null> => {
    try {
      const response = await api.get('/components');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch component library:', error);
      return null;
    }
  },
};

export const firmwareApi = {
  generateHex: async (config: FirmwareConfig, layout: KeyboardLayout): Promise<Blob | null> => {
    try {
      const response = await api.post('/firmware/generate', {
        config,
        layout,
      }, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate firmware:', error);
      return null;
    }
  },

  getConfig: async (): Promise<FirmwareConfig | null> => {
    try {
      const response = await api.get('/firmware/config');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch firmware config:', error);
      return null;
    }
  },

  saveConfig: async (config: FirmwareConfig): Promise<FirmwareConfig | null> => {
    try {
      const response = await api.post('/firmware/config', config);
      return response.data;
    } catch (error) {
      console.error('Failed to save firmware config:', error);
      return null;
    }
  },
};

export default api;
