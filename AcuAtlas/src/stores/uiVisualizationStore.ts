import { useState, useEffect } from 'react';
import { VisualizationState, MeridianType } from '../types';

let globalVisualizationState: VisualizationState = {
  showSkin: true,
  showMuscles: false,
  showBones: false,
  showMeridians: true,
  showAcupoints: true,
  skinOpacity: 0.8,
  muscleOpacity: 0.7,
  boneOpacity: 0.9,
  selectedMeridian: undefined,
  anatomicalView: 'front'
};

let globalVisualizationListeners: Set<() => void> = new Set();

function notifyVisualizationListeners() {
  globalVisualizationListeners.forEach(listener => listener());
}

export function useUIVisualizationStore() {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    globalVisualizationListeners.add(listener);
    return () => {
      globalVisualizationListeners.delete(listener);
    };
  }, []);

  return {
    ...globalVisualizationState,
    
    toggleSkin: () => {
      globalVisualizationState.showSkin = !globalVisualizationState.showSkin;
      notifyVisualizationListeners();
    },
    
    toggleMuscles: () => {
      globalVisualizationState.showMuscles = !globalVisualizationState.showMuscles;
      notifyVisualizationListeners();
    },
    
    toggleBones: () => {
      globalVisualizationState.showBones = !globalVisualizationState.showBones;
      notifyVisualizationListeners();
    },
    
    toggleMeridians: () => {
      globalVisualizationState.showMeridians = !globalVisualizationState.showMeridians;
      notifyVisualizationListeners();
    },
    
    toggleAcupoints: () => {
      globalVisualizationState.showAcupoints = !globalVisualizationState.showAcupoints;
      notifyVisualizationListeners();
    },
    
    setSkinOpacity: (opacity: number) => {
      globalVisualizationState.skinOpacity = Math.max(0, Math.min(1, opacity));
      notifyVisualizationListeners();
    },
    
    setMuscleOpacity: (opacity: number) => {
      globalVisualizationState.muscleOpacity = Math.max(0, Math.min(1, opacity));
      notifyVisualizationListeners();
    },
    
    setBoneOpacity: (opacity: number) => {
      globalVisualizationState.boneOpacity = Math.max(0, Math.min(1, opacity));
      notifyVisualizationListeners();
    },
    
    setSelectedMeridian: (meridian: MeridianType | undefined) => {
      globalVisualizationState.selectedMeridian = meridian;
      notifyVisualizationListeners();
    },
    
    setAnatomicalView: (view: VisualizationState['anatomicalView']) => {
      globalVisualizationState.anatomicalView = view;
      notifyVisualizationListeners();
    },
    
    setFullView: () => {
      globalVisualizationState.showSkin = true;
      globalVisualizationState.showMuscles = false;
      globalVisualizationState.showBones = false;
      globalVisualizationState.skinOpacity = 0.8;
      notifyVisualizationListeners();
    },
    
    setMuscularView: () => {
      globalVisualizationState.showSkin = true;
      globalVisualizationState.showMuscles = true;
      globalVisualizationState.showBones = false;
      globalVisualizationState.skinOpacity = 0.3;
      globalVisualizationState.muscleOpacity = 0.7;
      notifyVisualizationListeners();
    },
    
    setSkeletalView: () => {
      globalVisualizationState.showSkin = false;
      globalVisualizationState.showMuscles = false;
      globalVisualizationState.showBones = true;
      notifyVisualizationListeners();
    },
    
    setTransparentView: () => {
      globalVisualizationState.showSkin = true;
      globalVisualizationState.showMuscles = true;
      globalVisualizationState.showBones = true;
      globalVisualizationState.skinOpacity = 0.15;
      globalVisualizationState.muscleOpacity = 0.3;
      globalVisualizationState.boneOpacity = 0.8;
      notifyVisualizationListeners();
    }
  };
}
