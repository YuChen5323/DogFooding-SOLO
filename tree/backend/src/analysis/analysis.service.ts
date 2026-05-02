import { Injectable } from '@nestjs/common';

interface StressResult {
  id: string;
  stress: number;
  contactPressure: number[];
}

@Injectable()
export class AnalysisService {
  async calculateStress(params: {
    components: Array<{
      id: string;
      dimensions: { width: number; height: number; depth: number };
      material: string;
    }>;
    joints: Array<{
      id: string;
      componentA: string;
      componentB: string;
      type: string;
    }>;
    load: { x: number; y: number; z: number };
  }): Promise<StressResult[]> {
    const results: StressResult[] = [];

    params.joints.forEach((joint) => {
      const componentA = params.components.find((c) => c.id === joint.componentA);
      const componentB = params.components.find((c) => c.id === joint.componentB);

      if (!componentA || !componentB) return;

      const volumeA = componentA.dimensions.width * componentA.dimensions.height * componentA.dimensions.depth;
      const volumeB = componentB.dimensions.width * componentB.dimensions.height * componentB.dimensions.depth;

      const loadMagnitude = Math.sqrt(
        params.load.x ** 2 + params.load.y ** 2 + params.load.z ** 2,
      );

      const baseStress = (loadMagnitude * 100) / (Math.min(volumeA, volumeB) + 0.1);

      const typeFactors: Record<string, number> = {
        'tou-sun': 1.0,
        'ban-sun': 1.2,
        'da-yao': 0.8,
        'zhuan-jiao': 1.5,
      };

      const typeFactor = typeFactors[joint.type] || 1.0;
      const finalStress = Math.min(baseStress * typeFactor * (0.8 + Math.random() * 0.4), 100);

      const contactPressure = [
        finalStress * (0.7 + Math.random() * 0.3),
        finalStress * (0.6 + Math.random() * 0.4),
        finalStress * (0.5 + Math.random() * 0.5),
        finalStress * (0.4 + Math.random() * 0.6),
      ];

      results.push({
        id: joint.id,
        stress: finalStress,
        contactPressure,
      });
    });

    return results;
  }
}
