import { useState, useEffect } from 'react';
import { Acupoint, NeedleState, InsertionLayer } from '../types';
import { getAllAcupoints } from '../data/acupointData';

let globalAcupoints: Acupoint[] = [];
let globalSelectedAcupoint: Acupoint | null = null;
let globalIsInsertionMode = false;
let globalNeedleState: NeedleState | null = null;
let globalListeners: Set<() => void> = new Set();

function notifyListeners() {
  globalListeners.forEach(listener => listener());
}

export function useAcupointStore() {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  return {
    acupoints: globalAcupoints,
    selectedAcupoint: globalSelectedAcupoint,
    isInsertionMode: globalIsInsertionMode,
    needleState: globalNeedleState,
    
    setSelectedAcupoint: (acupoint: Acupoint | null) => {
      globalSelectedAcupoint = acupoint;
      notifyListeners();
    },
    
    setIsInsertionMode: (mode: boolean) => {
      globalIsInsertionMode = mode;
      if (!mode) {
        globalNeedleState = null;
      }
      notifyListeners();
    },
    
    loadAcupoints: async () => {
      globalAcupoints = await getAllAcupoints();
      notifyListeners();
    },
    
    startNeedleInsertion: (acupointId: string) => {
      const acupoint = globalAcupoints.find(a => (a as any).id === acupointId);
      if (!acupoint) return;
      
      const layers = acupoint.needling.layers.map((layer, index) => ({
        layer,
        startDepth: index * (acupoint.needling.maxDepth / acupoint.needling.layers.length),
        endDepth: (index + 1) * (acupoint.needling.maxDepth / acupoint.needling.layers.length),
        entered: false
      }));
      
      globalNeedleState = {
        acupointId,
        currentDepth: 0,
        maxDepth: acupoint.needling.maxDepth,
        currentLayer: 'skin' as InsertionLayer,
        layers,
        hasDeqi: false,
        deqiStrength: 0,
        isCorrectAngle: true
      };
      
      notifyListeners();
    },
    
    updateNeedleDepth: (depth: number) => {
      if (!globalNeedleState) return;
      
      const acupoint = globalAcupoints.find(a => (a as any).id === globalNeedleState!.acupointId);
      if (!acupoint) return;
      
      const clampedDepth = Math.min(Math.max(depth, 0), globalNeedleState.maxDepth);
      globalNeedleState.currentDepth = clampedDepth;
      
      for (const layer of globalNeedleState.layers) {
        if (clampedDepth >= layer.startDepth && clampedDepth < layer.endDepth) {
          layer.entered = true;
          globalNeedleState.currentLayer = layer.layer;
        }
      }
      
      const deqiThreshold = acupoint.needling.standardDepth * 0.7;
      if (clampedDepth >= deqiThreshold && !globalNeedleState.hasDeqi) {
        globalNeedleState.hasDeqi = true;
        globalNeedleState.deqiStrength = Math.min(1, (clampedDepth - deqiThreshold) / (acupoint.needling.standardDepth * 0.3));
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
      
      notifyListeners();
    },
    
    resetNeedleState: () => {
      globalNeedleState = null;
      notifyListeners();
    }
  };
}
