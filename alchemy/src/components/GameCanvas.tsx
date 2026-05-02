import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GAME_CONFIG } from '../game/config';
import { LabScene } from '../game/scenes/LabScene';
import type { InventoryItem } from '../types';

interface GameCanvasProps {
  inventory: InventoryItem[];
  onInventoryUpdate: (items: InventoryItem[]) => void;
  onBrewingStart: () => void;
  onBrewingComplete: (success: boolean, explosion: boolean, resultItemId: string | null, message: string) => void;
  labSceneRef: React.MutableRefObject<LabScene | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  inventory,
  onInventoryUpdate,
  onBrewingStart,
  onBrewingComplete,
  labSceneRef,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...GAME_CONFIG,
      parent: containerRef.current,
      callbacks: {
        postBoot: (game) => {
          const scene = game.scene.getScene('LabScene') as LabScene;
          if (scene) {
            labSceneRef.current = scene;
            scene.setInventory(inventory);
            scene.onInventoryUpdate = onInventoryUpdate;
            scene.onBrewingStart = onBrewingStart;
            scene.onBrewingComplete = onBrewingComplete;
          }
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (labSceneRef.current) {
      labSceneRef.current.setInventory(inventory);
    }
  }, [inventory]);

  return (
    <div
      ref={containerRef}
      id="game-container"
      className="w-full h-full flex items-center justify-center"
    />
  );
};
