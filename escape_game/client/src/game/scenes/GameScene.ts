import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { rooms, puzzles, diaryEntries } from '../data/rooms';
import { items, combinationRecipes } from '../data/items';
import { audioManager } from '../../services/audio';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

type GameCallback = {
  onRoomChange: (roomId: string) => void;
  onInventoryUpdate: (inventory: string[]) => void;
  onDiaryDiscover: (entryId: string) => void;
  onPuzzleStart: (puzzleId: string) => void;
  onDialogue: (text: string) => void;
  onItemPickup: (itemId: string) => void;
  onGameComplete: () => void;
};

const roomColors: Record<string, number> = {
  entrance: 0x1a1a2e,
  hall: 0x16213e,
  library: 0x0f3460,
  study: 0x1a1a2e,
  secret_room: 0x2d0a2e
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private currentRoomId: string = 'entrance';
  private gameState: any = {
    inventory: [] as string[],
    flags: {} as Record<string, boolean>,
    puzzlesSolved: [] as string[],
    diaryEntries: [] as string[]
  };
  private roomSprites: Map<string, Phaser.GameObjects.Zone> = new Map();
  private interactables: Map<string, { zone: Phaser.GameObjects.Zone; data: any }> = new Map();
  private isTransitioning: boolean = false;
  private roomText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private callback!: GameCallback;
  private collectedItems: Set<string> = new Set();
  private roomBackground!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { initialState?: any; callback?: GameCallback }) {
    if (data.initialState) {
      this.gameState = {
        ...this.gameState,
        ...data.initialState
      };
      this.currentRoomId = data.initialState.currentRoom || 'entrance';
    }
    if (data.callback) {
      this.callback = data.callback;
    }
  }

  preload() {
    this.generateTextures();
  }

  private generateTextures() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x4a90d9, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.fillStyle(0xffe4c4, 1);
    graphics.fillRect(8, 0, 16, 16);
    graphics.fillStyle(0x2c1810, 1);
    graphics.fillRect(10, 5, 4, 4);
    graphics.fillRect(18, 5, 4, 4);
    graphics.generateTexture('player_face', 32, 48);
    graphics.clear();

    graphics.fillStyle(0x4a90d9, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.fillStyle(0x2c1810, 1);
    graphics.fillRect(8, 0, 16, 12);
    graphics.generateTexture('player_back', 32, 48);
    graphics.clear();

    graphics.fillStyle(0x4a90d9, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.fillStyle(0xffe4c4, 1);
    graphics.fillRect(4, 0, 12, 16);
    graphics.fillStyle(0x2c1810, 1);
    graphics.fillRect(6, 4, 3, 3);
    graphics.generateTexture('player_left', 32, 48);
    graphics.clear();

    graphics.fillStyle(0x4a90d9, 1);
    graphics.fillRect(0, 0, 32, 48);
    graphics.fillStyle(0xffe4c4, 1);
    graphics.fillRect(16, 0, 12, 16);
    graphics.fillStyle(0x2c1810, 1);
    graphics.fillRect(22, 4, 3, 3);
    graphics.generateTexture('player_right', 32, 48);
    graphics.clear();

    graphics.destroy();
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0f');

    this.roomBackground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      roomColors[this.currentRoomId] || 0x1a1a2e
    );
    this.roomBackground.setDepth(-1);

    this.loadRoom(this.currentRoomId);

    const startX = this.gameState.playerPosition?.x || 400;
    const startY = this.gameState.playerPosition?.y || 450;
    this.player = new Player(this, startX, startY);

    this.physics.add.overlap(
      this.player,
      this.physics.add.staticGroup(),
      () => {},
      undefined,
      this
    );

    this.setupUI();

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.checkInteraction();
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleClick(pointer.x, pointer.y);
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      this.checkInteraction();
    });

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private setupUI() {
    this.roomText = this.add.text(20, 20, '', {
      fontSize: '24px',
      color: '#ffa600',
      fontFamily: 'serif'
    }).setDepth(100).setScrollFactor(0);

    this.descriptionText = this.add.text(20, 50, '', {
      fontSize: '14px',
      color: '#a0a0a0',
      fontFamily: 'sans-serif',
      wordWrap: { width: GAME_WIDTH - 40 }
    }).setDepth(100).setScrollFactor(0);

    this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 30,
      '方向键/WASD移动 | 空格键/E键互动 | 点击物品拾取',
      {
        fontSize: '12px',
        color: '#666666',
        fontFamily: 'sans-serif'
      }
    )
      .setDepth(100)
      .setScrollFactor(0)
      .setOrigin(0.5);
  }

  private loadRoom(roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    this.roomSprites.forEach(sprite => sprite.destroy());
    this.roomSprites.clear();
    this.interactables.forEach(({ zone }) => zone.destroy());
    this.interactables.clear();

    this.roomText.setText(room.name);
    this.descriptionText.setText(room.description);

    if (this.roomBackground) {
      this.roomBackground.fillColor = roomColors[roomId] || 0x1a1a2e;
    }

    this.addRoomDecorations(roomId);

    room.exits.forEach(exit => {
      const zone = this.add.zone(
        exit.position.x,
        exit.position.y,
        exit.position.width,
        exit.position.height
      );
      zone.setOrigin(0);
      this.roomSprites.set(`exit_${exit.direction}`, zone);

      const indicator = this.add.rectangle(
        exit.position.x + exit.position.width / 2,
        exit.position.y + exit.position.height / 2,
        exit.position.width,
        exit.position.height,
        0xffa600,
        0.2
      );
      indicator.setDepth(0);
      indicator.setOrigin(0);
    });

    room.interactables.forEach(interactable => {
      if (interactable.type === 'item' && this.collectedItems.has(interactable.id)) {
        return;
      }

      if (interactable.flags && !this.gameState.flags[interactable.flags]) {
        return;
      }

      const zone = this.add.zone(
        interactable.position.x,
        interactable.position.y,
        interactable.position.width,
        interactable.position.height
      );
      zone.setOrigin(0);
      this.interactables.set(interactable.id, { zone, data: interactable });

      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xffa600, 0.3);
      graphics.strokeRect(
        interactable.position.x,
        interactable.position.y,
        interactable.position.width,
        interactable.position.height
      );
      graphics.setDepth(1);

      if (interactable.type === 'item' && interactable.itemId) {
        const item = items[interactable.itemId as keyof typeof items];
        if (item) {
          const itemIcon = this.add.text(
            interactable.position.x + interactable.position.width / 2,
            interactable.position.y + interactable.position.height / 2,
            item.icon,
            { fontSize: '32px' }
          );
          itemIcon.setOrigin(0.5);
          itemIcon.setDepth(2);
        }
      }
    });
  }

  private addRoomDecorations(roomId: string) {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    switch (roomId) {
      case 'entrance':
        this.addDoorDecoration(centerX, 100, '北');
        this.addWindowDecoration(100, centerY);
        this.addWindowDecoration(GAME_WIDTH - 100, centerY);
        break;
      case 'hall':
        this.addDoorDecoration(centerX, 100, '北');
        this.addDoorDecoration(centerX, GAME_HEIGHT - 50, '南');
        this.addTableDecoration(centerX, centerY);
        break;
      case 'library':
        this.addBookshelfDecoration(100, centerY);
        this.addBookshelfDecoration(GAME_WIDTH - 100, centerY);
        this.addDoorDecoration(centerX, GAME_HEIGHT - 50, '南');
        break;
      case 'study':
        this.addDeskDecoration(centerX, centerY);
        this.addDoorDecoration(centerX, GAME_HEIGHT - 50, '南');
        break;
      case 'secret_room':
        this.addAltarDecoration(centerX, centerY);
        break;
    }
  }

  private addDoorDecoration(x: number, y: number, direction: string) {
    const door = this.add.rectangle(x, y, 80, 100, 0x4a3728);
    door.setDepth(0);
    door.setOrigin(0.5);
    
    const knob = this.add.circle(
      direction === '北' ? x + 25 : x - 25,
      y,
      5,
      0xffa600
    );
    knob.setDepth(0);
  }

  private addWindowDecoration(x: number, y: number) {
    const window = this.add.rectangle(x, y, 60, 80, 0x2a3f5f);
    window.setDepth(0);
    window.setOrigin(0.5);
    
    const cross = this.add.line(x, y, x - 30, y, x + 30, y, 0x666666);
    cross.setDepth(0);
    
    const cross2 = this.add.line(x, y, x, y - 40, x, y + 40, 0x666666);
    cross2.setDepth(0);
  }

  private addTableDecoration(x: number, y: number) {
    const table = this.add.rectangle(x, y, 120, 60, 0x5c4033);
    table.setDepth(0);
    table.setOrigin(0.5);
    
    const candle1 = this.add.circle(x - 30, y - 20, 8, 0xffffff);
    candle1.setDepth(0);
    
    const candle2 = this.add.circle(x + 30, y - 20, 8, 0xffffff);
    candle2.setDepth(0);
  }

  private addBookshelfDecoration(x: number, y: number) {
    const shelf = this.add.rectangle(x, y, 100, 200, 0x3d2b1f);
    shelf.setDepth(0);
    shelf.setOrigin(0.5);
    
    for (let i = 0; i < 5; i++) {
      const shelfLine = this.add.line(
        x,
        y - 80 + i * 40,
        x - 45,
        y - 80 + i * 40,
        x + 45,
        y - 80 + i * 40,
        0x2a1a0f
      );
      shelfLine.setDepth(0);
      shelfLine.setLineWidth(3);
    }
  }

  private addDeskDecoration(x: number, y: number) {
    const desk = this.add.rectangle(x, y, 150, 80, 0x4a3728);
    desk.setDepth(0);
    desk.setOrigin(0.5);
    
    const paper = this.add.rectangle(x, y - 10, 60, 40, 0xf5f5dc);
    paper.setDepth(0);
    paper.setOrigin(0.5);
    
    const ink = this.add.circle(x + 40, y, 10, 0x1a1a1a);
    ink.setDepth(0);
  }

  private addAltarDecoration(x: number, y: number) {
    const altar = this.add.ellipse(x, y, 150, 80, 0x2d0a2e);
    altar.setDepth(0);
    altar.setStrokeStyle(3, 0xffa600);
    
    const runeText = this.add.text(x, y, '✧', {
      fontSize: '48px',
      color: '#ffa600'
    });
    runeText.setOrigin(0.5);
    runeText.setDepth(1);
    
    const candlePositions = [
      { x: x - 60, y: y - 40 },
      { x: x + 60, y: y - 40 },
      { x: x - 60, y: y + 40 },
      { x: x + 60, y: y + 40 }
    ];
    
    candlePositions.forEach(pos => {
      const candle = this.add.circle(pos.x, pos.y, 10, 0xffffff);
      candle.setDepth(0);
      
      const glow = this.add.circle(pos.x, pos.y, 20, 0xffa600, 0.3);
      glow.setDepth(0);
    });
  }

  private handleClick(x: number, y: number) {
    if (this.isTransitioning) return;

    for (const [_id, { zone, data }] of this.interactables) {
      if (this.isPointInZone(x, y, zone)) {
        this.handleInteract(data);
        return;
      }
    }

    const room = rooms[this.currentRoomId];
    if (room) {
      for (const exit of room.exits) {
        const zone = this.add.zone(
          exit.position.x,
          exit.position.y,
          exit.position.width,
          exit.position.height
        );
        zone.setOrigin(0);
        
        if (this.isPointInZone(x, y, zone)) {
          this.tryExit(exit);
          zone.destroy();
          return;
        }
        zone.destroy();
      }
    }
  }

  private isPointInZone(x: number, y: number, zone: Phaser.GameObjects.Zone): boolean {
    return (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    );
  }

  private checkInteraction() {
    if (this.isTransitioning) return;

    const room = rooms[this.currentRoomId];
    if (!room) return;

    for (const [_id, { zone, data }] of this.interactables) {
      if (this.physics.overlap(this.player, zone)) {
        this.handleInteract(data);
        return;
      }
    }

    for (const exit of room.exits) {
      const zone = this.add.zone(
        exit.position.x,
        exit.position.y,
        exit.position.width,
        exit.position.height
      );
      zone.setOrigin(0);

      if (this.physics.overlap(this.player, zone)) {
        this.tryExit(exit);
        zone.destroy();
        return;
      }
      zone.destroy();
    }
  }

  private handleInteract(data: any) {
    audioManager.playSound('click');

    switch (data.type) {
      case 'item':
        this.pickupItem(data);
        break;
      case 'puzzle':
        this.startPuzzle(data);
        break;
      case 'diary':
        this.readDiary(data);
        break;
    }
  }

  private pickupItem(data: any) {
    const itemId = data.itemId;
    if (!itemId || this.gameState.inventory.includes(itemId)) return;

    this.gameState.inventory.push(itemId);
    this.collectedItems.add(data.id);

    const item = items[itemId];
    audioManager.playSound('item_pickup');

    if (this.callback?.onDialogue) {
      this.callback.onDialogue(`获得了：${item?.name || itemId}\n${item?.description || ''}`);
    }

    if (this.callback?.onItemPickup) {
      this.callback.onItemPickup(itemId);
    }

    if (this.callback?.onInventoryUpdate) {
      this.callback.onInventoryUpdate(this.gameState.inventory);
    }

    this.loadRoom(this.currentRoomId);

    this.checkAchievements();
  }

  private startPuzzle(data: any) {
    const puzzleId = data.puzzleId;
    const puzzle = puzzles[puzzleId];

    if (!puzzle) {
      if (data.dialogue && this.callback?.onDialogue) {
        this.callback.onDialogue(data.dialogue);
      }
      return;
    }

    if (this.gameState.puzzlesSolved.includes(puzzleId)) {
      if (this.callback?.onDialogue) {
        this.callback.onDialogue('这个谜题已经解开了。');
      }
      return;
    }

    if (data.requiresItem && !this.gameState.inventory.includes(data.requiresItem)) {
      const requiredItem = items[data.requiresItem];
      if (this.callback?.onDialogue) {
        this.callback.onDialogue(`这里似乎需要${requiredItem?.name || '某个物品'}...`);
      }
      return;
    }

    if (data.requiresItem && this.gameState.inventory.includes(data.requiresItem)) {
      this.solvePuzzle(puzzleId, puzzle);
      return;
    }

    if (this.callback?.onPuzzleStart) {
      this.callback.onPuzzleStart(puzzleId);
    }
  }

  private readDiary(data: any) {
    const entryId = data.id;
    const entry = diaryEntries[entryId];

    if (!entry) {
      if (data.dialogue && this.callback?.onDialogue) {
        this.callback.onDialogue(data.dialogue);
      }
      return;
    }

    if (!this.gameState.diaryEntries.includes(entryId)) {
      this.gameState.diaryEntries.push(entryId);
      if (this.callback?.onDiaryDiscover) {
        this.callback.onDiaryDiscover(entryId);
      }
    }

    if (this.callback?.onDialogue) {
      this.callback.onDialogue(`【${entry.title}】\n\n${entry.content}`);
    }

    this.checkAchievements();
  }

  private tryExit(exit: any) {
    if (exit.locked) {
      if (exit.unlockItem) {
        if (this.gameState.inventory.includes(exit.unlockItem)) {
          this.gameState.inventory = this.gameState.inventory.filter((i: string) => i !== exit.unlockItem);
          if (this.callback?.onInventoryUpdate) {
            this.callback.onInventoryUpdate(this.gameState.inventory);
          }
          this.transitionToRoom(exit.targetRoom);
        } else {
          audioManager.playSound('door_locked');
          const item = items[exit.unlockItem];
          if (this.callback?.onDialogue) {
            this.callback.onDialogue(`这扇门被锁住了...似乎需要${item?.name || '一把钥匙'}。`);
          }
        }
      } else if (exit.unlockCondition) {
        if (this.gameState.flags[exit.unlockCondition]) {
          this.transitionToRoom(exit.targetRoom);
        } else {
          audioManager.playSound('door_locked');
          if (this.callback?.onDialogue) {
            this.callback.onDialogue('这扇门似乎被某种力量封印着...');
          }
        }
      } else {
        audioManager.playSound('door_locked');
        if (this.callback?.onDialogue) {
          this.callback.onDialogue('这扇门被锁住了...');
        }
      }
    } else {
      this.transitionToRoom(exit.targetRoom);
    }
  }

  private transitionToRoom(roomId: string) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    audioManager.playSound('transition');
    audioManager.playSound('door_open');

    this.cameras.main.fadeOut(500, 10, 10, 15);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.currentRoomId = roomId;
      this.loadRoom(roomId);

      const room = rooms[roomId];
      const startPosition = this.getOppositeExitPosition(room);
      this.player.setPosition(startPosition.x, startPosition.y);

      if (this.callback?.onRoomChange) {
        this.callback.onRoomChange(roomId);
      }

      audioManager.playMusic(roomId);

      this.cameras.main.fadeIn(500, 10, 10, 15);

      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
      });
    });
  }

  private getOppositeExitPosition(room: any): { x: number; y: number } {
    for (const exit of room.exits) {
      if (exit.targetRoom === this.currentRoomId) {
        const direction = exit.direction;
        switch (direction) {
          case '南':
            return { x: GAME_WIDTH / 2, y: 100 };
          case '北':
            return { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100 };
          case '东':
            return { x: 100, y: GAME_HEIGHT / 2 };
          case '西':
            return { x: GAME_WIDTH - 100, y: GAME_HEIGHT / 2 };
        }
      }
    }
    return { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  }

  solvePuzzle(puzzleId: string, puzzle: any) {
    if (this.gameState.puzzlesSolved.includes(puzzleId)) return;

    this.gameState.puzzlesSolved.push(puzzleId);

    if (puzzle.rewardItem && !this.gameState.inventory.includes(puzzle.rewardItem)) {
      this.gameState.inventory.push(puzzle.rewardItem);
      const rewardItem = items[puzzle.rewardItem];

      audioManager.playSound('item_pickup');

      if (this.callback?.onDialogue) {
        this.callback.onDialogue(`谜题解开了！\n获得了：${rewardItem?.name || puzzle.rewardItem}\n${rewardItem?.description || ''}`);
      }

      if (this.callback?.onInventoryUpdate) {
        this.callback.onInventoryUpdate(this.gameState.inventory);
      }
    }

    if (puzzle.unlocksFlag) {
      this.gameState.flags[puzzle.unlocksFlag] = true;

      if (puzzle.unlocksFlag === 'game_completed' && this.callback?.onGameComplete) {
        this.callback.onGameComplete();
      }

      if (puzzle.unlocksFlag === 'mechanism_activated') {
        this.loadRoom(this.currentRoomId);
      }
    }

    audioManager.playSound('puzzle_solve');
    this.checkAchievements();
  }

  getGameState() {
    return {
      ...this.gameState,
      currentRoom: this.currentRoomId,
      playerPosition: {
        x: this.player.x,
        y: this.player.y
      }
    };
  }

  private checkAchievements() {
    const achievements: { id: string; check: () => boolean }[] = [
      {
        id: 'first_puzzle',
        check: () => this.gameState.puzzlesSolved.length >= 1
      },
      {
        id: 'item_collector',
        check: () => this.gameState.inventory.length >= 5
      },
      {
        id: 'diary_reader',
        check: () => this.gameState.diaryEntries.length >= 3
      },
      {
        id: 'all_puzzles',
        check: () => this.gameState.puzzlesSolved.length >= 5
      }
    ];

    for (const achievement of achievements) {
      if (!this.gameState.achievementsUnlocked?.includes(achievement.id) && achievement.check()) {
        if (!this.gameState.achievementsUnlocked) {
          this.gameState.achievementsUnlocked = [];
        }
        this.gameState.achievementsUnlocked.push(achievement.id);
      }
    }
  }

  combineItems(item1Id: string, item2Id: string): boolean {
    const key1 = `${item1Id},${item2Id}`;
    const key2 = `${item2Id},${item1Id}`;
    
    const resultId = combinationRecipes[key1] || combinationRecipes[key2];
    
    if (!resultId) return false;

    if (!this.gameState.inventory.includes(item1Id) || !this.gameState.inventory.includes(item2Id)) {
      return false;
    }

    this.gameState.inventory = this.gameState.inventory.filter((i: string) => i !== item1Id && i !== item2Id);
    this.gameState.inventory.push(resultId);

    const resultItem = items[resultId];
    audioManager.playSound('item_pickup');

    if (this.callback?.onDialogue) {
      this.callback.onDialogue(`组合成功！\n获得了：${resultItem?.name || resultId}\n${resultItem?.description || ''}`);
    }

    if (this.callback?.onInventoryUpdate) {
      this.callback.onInventoryUpdate(this.gameState.inventory);
    }

    return true;
  }

  update(_time: number, delta: number) {
    if (this.player && !this.isTransitioning) {
      this.player.update(delta);
    }
  }
}
