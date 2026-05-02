import { Injectable, NotFoundException } from '@nestjs/common';

interface EarthquakeWave {
  id: string;
  name: string;
  magnitude: number;
  duration: number;
  description: string;
}

interface SimulationResult {
  timestamp: number;
  acceleration: { x: number; y: number; z: number };
  displacement: { x: number; y: number; z: number };
  energyDissipated: number;
}

const predefinedWaves: EarthquakeWave[] = [
  {
    id: 'elcentro',
    name: 'El Centro 波 (1940)',
    magnitude: 7.1,
    duration: 30,
    description: '1940年美国帝国谷地震记录',
  },
  {
    id: 'northridge',
    name: 'Northridge 波 (1994)',
    magnitude: 6.7,
    duration: 40,
    description: '1994年美国北岭地震记录',
  },
  {
    id: 'kobe',
    name: 'Kobe 波 (1995)',
    magnitude: 6.9,
    duration: 50,
    description: '1995年日本阪神地震记录',
  },
  {
    id: 'tangshan',
    name: '唐山波 (模拟)',
    magnitude: 7.8,
    duration: 45,
    description: '1976年唐山地震模拟波形',
  },
  {
    id: 'wenchuan',
    name: '汶川波 (模拟)',
    magnitude: 8.0,
    duration: 60,
    description: '2008年汶川地震模拟波形',
  },
];

@Injectable()
export class EarthquakeService {
  async getAvailableWaves(): Promise<EarthquakeWave[]> {
    return predefinedWaves;
  }

  async getWaveData(id: string): Promise<number[]> {
    const wave = predefinedWaves.find((w) => w.id === id);
    if (!wave) {
      throw new NotFoundException(`地震波 ${id} 不存在`);
    }

    const sampleRate = 100;
    const totalSamples = wave.duration * sampleRate;
    const data: number[] = [];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const pga = wave.magnitude * 0.1;
      const decay = Math.exp(-t / (wave.duration * 0.3));

      const freq1 = Math.sin(t * 2 * Math.PI * 1.5);
      const freq2 = Math.sin(t * 2 * Math.PI * 3.2) * 0.6;
      const freq3 = Math.sin(t * 2 * Math.PI * 5.5) * 0.3;
      const noise = (Math.random() - 0.5) * 0.2;

      const value = (freq1 + freq2 + freq3 + noise) * pga * decay;
      data.push(value);
    }

    return data;
  }

  async runSimulation(params: {
    waveId: string;
    magnitude: number;
    components: any[];
    joints: any[];
  }): Promise<SimulationResult[]> {
    const wave = predefinedWaves.find((w) => w.id === params.waveId);
    if (!wave) {
      throw new NotFoundException(`地震波 ${params.waveId} 不存在`);
    }

    const results: SimulationResult[] = [];
    const sampleRate = 20;
    const duration = Math.min(wave.duration, 30);

    for (let i = 0; i < duration * sampleRate; i++) {
      const t = i / sampleRate;
      const pga = params.magnitude * 0.1;
      const decay = Math.exp(-t / (duration * 0.3));

      const freq1 = Math.sin(t * 2 * Math.PI * 1.5);
      const freq2 = Math.sin(t * 2 * Math.PI * 3.2) * 0.6;
      const noise = (Math.random() - 0.5) * 0.2;

      const accel = (freq1 + freq2 + noise) * pga * decay;

      const displacement = {
        x: Math.sin(t) * params.magnitude * 0.01,
        y: 0,
        z: Math.cos(t) * params.magnitude * 0.01,
      };

      const energy = params.magnitude * t * 10 * (1 + Math.random() * 0.2);

      results.push({
        timestamp: t,
        acceleration: { x: accel * 0.5, y: 0, z: accel },
        displacement,
        energyDissipated: energy,
      });
    }

    return results;
  }
}
