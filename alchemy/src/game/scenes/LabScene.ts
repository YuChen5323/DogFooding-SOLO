import Phaser from 'phaser';
import type { InventoryItem, SymbolType } from '../../types';
import { ITEMS, EXTRACTS } from '../../data/items';
import { RECIPES, SYMBOLS } from '../../data/recipes';

type EquipmentType = 'mortar' | 'distiller' | 'cauldron';

interface DraggedItem {
  itemId: string;
  sprite: Phaser.GameObjects.Text;
  originalX: number;
  originalY: number;
}

interface EquipmentZone {
  type: EquipmentType;
  zone: Phaser.GameObjects.Zone;
  items: string[];
  highlight?: Phaser.GameObjects.Rectangle;
}

export class LabScene extends Phaser.Scene {
  private inventoryItems: InventoryItem[] = [];
  private draggedItem: DraggedItem | null = null;
  private equipmentZones: EquipmentZone[] = [];
  private isBrewing: boolean = false;
  private currentSymbols: (SymbolType | null)[] = [null, null, null, null];
  private symbolSprites: Phaser.GameObjects.Text[] = [];
  
  public onItemGrinded?: (itemId: string, resultItemId: string) => void;
  public onItemDistilled?: (itemId: string, resultItemId: string) => void;
  public onBrewingStart?: () => void;
  public onBrewingComplete?: (success: boolean, explosion: boolean, resultItemId: string | null, message: string) => void;
  public onInventoryUpdate?: (items: InventoryItem[]) => void;

  constructor() {
    super({ key: 'LabScene' });
  }

  preload() {
    this.load.setBaseURL('');
  }

  create() {
    this.createBackground();
    this.createEquipment();
    this.createInventorySlots();
    this.createSymbolSelector();
    this.setupInput();
    
    this.input.on('pointerup', this.handlePointerUp, this);
  }

  setInventory(items: InventoryItem[]) {
    this.inventoryItems = items;
    this.updateInventoryDisplay();
  }

  private createBackground() {
    const background = this.add.rectangle(0, 0, 1200, 700, 0x1f140a);
    background.setOrigin(0, 0);
    
    this.add.rectangle(0, 500, 1200, 200, 0x3d291a).setOrigin(0, 0);
    
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 1200);
      const y = Phaser.Math.Between(0, 500);
      const size = Phaser.Math.FloatBetween(1, 3);
      this.add.circle(x, y, size, 0x4a3525, 0.3);
    }
    
    this.add.text(600, 30, '炼金实验室', {
      fontFamily: 'Georgia',
      fontSize: '32px',
      color: '#d4af37',
      fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(2, 2, '#000', 5);
  }

  private createEquipment() {
    const mortarX = 250;
    const mortarY = 400;
    
    this.add.rectangle(mortarX, mortarY + 50, 200, 30, 0x5c3f2a).setStrokeStyle(2, 0xd4af37);
    const mortar = this.add.ellipse(mortarX, mortarY, 100, 40, 0x8b6914);
    mortar.setStrokeStyle(3, 0xd4af37);
    
    this.add.ellipse(mortarX, mortarY - 10, 80, 30, 0x9c6f4a);
    const pestle = this.add.rectangle(mortarX + 60, mortarY - 30, 20, 80, 0x8b6914);
    pestle.setAngle(-30);
    pestle.setStrokeStyle(2, 0xd4af37);
    
    this.add.text(mortarX, mortarY + 80, '研磨台', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d4af37',
    }).setOrigin(0.5);
    
    const mortarZone = this.add.zone(mortarX, mortarY, 120, 80);
    mortarZone.setDropZone();
    this.equipmentZones.push({
      type: 'mortar',
      zone: mortarZone,
      items: [],
    });

    const distillerX = 600;
    const distillerY = 380;
    
    this.add.rectangle(distillerX, distillerY + 80, 180, 30, 0x5c3f2a).setStrokeStyle(2, 0xd4af37);
    
    const flask = this.add.ellipse(distillerX, distillerY + 20, 60, 80, 0x4a90d9, 0.6);
    flask.setStrokeStyle(3, 0xd4af37);
    
    const neck = this.add.rectangle(distillerX, distillerY - 40, 20, 50, 0x4a90d9, 0.6);
    neck.setStrokeStyle(2, 0xd4af37);
    
    const pipe = this.add.rectangle(distillerX + 60, distillerY - 40, 80, 15, 0x8b6914);
    pipe.setStrokeStyle(2, 0xd4af37);
    
    const condenser = this.add.ellipse(distillerX + 120, distillerY + 20, 40, 60, 0x4a90d9, 0.4);
    condenser.setStrokeStyle(2, 0xd4af37);
    
    this.add.text(distillerX, distillerY + 120, '蒸馏器', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d4af37',
    }).setOrigin(0.5);
    
    const distillerZone = this.add.zone(distillerX, distillerY, 250, 180);
    distillerZone.setDropZone();
    this.equipmentZones.push({
      type: 'distiller',
      zone: distillerZone,
      items: [],
    });

    const cauldronX = 950;
    const cauldronY = 400;
    
    this.add.rectangle(cauldronX, cauldronY + 80, 200, 30, 0x5c3f2a).setStrokeStyle(2, 0xd4af37);
    
    const fire = this.add.circle(cauldronX, cauldronY + 60, 30, 0xff6b35, 0.8);
    this.tweens.add({
      targets: fire,
      scale: { from: 0.8, to: 1.2 },
      alpha: { from: 0.6, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    const cauldronBody = this.add.ellipse(cauldronX, cauldronY + 10, 100, 90, 0x2e303a);
    cauldronBody.setStrokeStyle(4, 0xd4af37);
    
    const liquid = this.add.ellipse(cauldronX, cauldronY + 20, 80, 30, 0x7cfc00, 0.7);
    this.tweens.add({
      targets: liquid,
      scaleY: { from: 0.8, to: 1.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    
    const rim = this.add.ellipse(cauldronX, cauldronY - 30, 90, 20, 0x1a0a2e);
    rim.setStrokeStyle(3, 0xd4af37);
    
    this.add.text(cauldronX, cauldronY + 130, '炼金釜', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d4af37',
    }).setOrigin(0.5);
    
    const cauldronZone = this.add.zone(cauldronX, cauldronY, 150, 150);
    cauldronZone.setDropZone();
    this.equipmentZones.push({
      type: 'cauldron',
      zone: cauldronZone,
      items: [],
    });
  }

  private createInventorySlots() {
    const startX = 100;
    const startY = 580;
    const slotSize = 60;
    const gap = 10;
    
    for (let i = 0; i < 12; i++) {
      const x = startX + i * (slotSize + gap);
      const y = startY;
      
      const slot = this.add.rectangle(x, y, slotSize, slotSize, 0x3d291a);
      slot.setStrokeStyle(2, 0xb87333);
      slot.setData('slotIndex', i);
      slot.setInteractive();
      
      slot.on('pointerover', () => {
        if (this.inventoryItems[i]) {
          slot.setStrokeStyle(3, 0xd4af37);
        }
      });
      
      slot.on('pointerout', () => {
        slot.setStrokeStyle(2, 0xb87333);
      });
    }
    
    this.updateInventoryDisplay();
  }

  private createSymbolSelector() {
    const startX = 850;
    const startY = 200;
    const symbolSize = 50;
    const gap = 15;
    
    this.add.text(startX + 60, startY - 40, '炼金符号', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#d4af37',
    }).setOrigin(0.5);
    
    for (let i = 0; i < SYMBOLS.length; i++) {
      const x = startX + (i % 5) * (symbolSize + gap);
      const y = startY + Math.floor(i / 5) * (symbolSize + gap);
      
      const symbolCircle = this.add.circle(x, y, symbolSize / 2, 0x3d291a);
      symbolCircle.setStrokeStyle(2, 0xd4af37);
      symbolCircle.setInteractive();
      
      const symbolText = this.add.text(x, y, SYMBOLS[i].symbol, {
        fontSize: '28px',
        color: '#d4af37',
      }).setOrigin(0.5);
      
      symbolCircle.on('pointerover', () => {
        symbolCircle.setStrokeStyle(3, 0xff6b35);
        symbolText.setColor('#ff6b35');
      });
      
      symbolCircle.on('pointerout', () => {
        symbolCircle.setStrokeStyle(2, 0xd4af37);
        symbolText.setColor('#d4af37');
      });
      
      symbolCircle.on('pointerdown', () => {
        if (this.draggedItem && this.draggedItem.sprite) {
          const cauldronZone = this.equipmentZones.find(z => z.type === 'cauldron');
          if (cauldronZone && cauldronZone.items.length > 0) {
            const lastIndex = cauldronZone.items.length - 1;
            if (lastIndex < 4) {
              this.currentSymbols[lastIndex] = SYMBOLS[i].symbol as SymbolType;
              this.updateSymbolDisplay();
            }
          }
        }
      });
    }
    
    for (let i = 0; i < 4; i++) {
      const x = 950 + (i - 1.5) * 55;
      const y = 280;
      
      const slot = this.add.circle(x, y, 25, 0x1f140a);
      slot.setStrokeStyle(2, 0xd4af37);
      
      const text = this.add.text(x, y, '?', {
        fontSize: '24px',
        color: '#6b6375',
      }).setOrigin(0.5);
      
      this.symbolSprites.push(text);
    }
    
    this.add.text(950, 330, '配方槽 (拖入材料后点击符号)', {
      fontFamily: 'Georgia',
      fontSize: '12px',
      color: '#b88b5a',
    }).setOrigin(0.5);
  }

  private updateSymbolDisplay() {
    for (let i = 0; i < 4; i++) {
      if (this.currentSymbols[i]) {
        this.symbolSprites[i].setText(this.currentSymbols[i]!);
        this.symbolSprites[i].setColor('#d4af37');
      } else {
        this.symbolSprites[i].setText('?');
        this.symbolSprites[i].setColor('#6b6375');
      }
    }
  }

  private updateInventoryDisplay() {
    const startX = 100;
    const startY = 580;
    const slotSize = 60;
    const gap = 10;
    
    this.children.list.forEach(child => {
      if (child.getData('isInventoryIcon')) {
        child.destroy();
      }
    });
    
    this.inventoryItems.forEach((item, index) => {
      if (index < 12) {
        const x = startX + index * (slotSize + gap);
        const y = startY;
        
        const icon = this.add.text(x, y - 10, item.icon, {
          fontSize: '32px',
        }).setOrigin(0.5);
        icon.setData('isInventoryIcon', true);
        icon.setInteractive();
        icon.setData('itemId', item.id);
        
        const count = this.add.text(x + 20, y + 15, `x${item.quantity}`, {
          fontSize: '12px',
          color: '#d4af37',
        }).setOrigin(0.5);
        count.setData('isInventoryIcon', true);
        
        this.input.setDraggable(icon);
        
        icon.on('dragstart', (_pointer: Phaser.Input.Pointer, _dragX: number, _dragY: number) => {
          const itemId = icon.getData('itemId') as string;
          this.draggedItem = {
            itemId,
            sprite: icon,
            originalX: x,
            originalY: y - 10,
          };
          icon.setScale(1.2);
          icon.setDepth(100);
        });
        
        icon.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
          icon.x = dragX;
          icon.y = dragY;
        });
      }
    });
  }

  private setupInput() {
    this.input.on('dragenter', (_pointer: Phaser.Input.Pointer, _gameObject: Phaser.GameObjects.GameObject, dropZone: Phaser.GameObjects.Zone) => {
      const equipment = this.equipmentZones.find(e => e.zone === dropZone);
      if (equipment) {
        this.highlightZone(equipment.type, true);
      }
    });
    
    this.input.on('dragleave', (_pointer: Phaser.Input.Pointer, _gameObject: Phaser.GameObjects.GameObject, dropZone: Phaser.GameObjects.Zone) => {
      const equipment = this.equipmentZones.find(e => e.zone === dropZone);
      if (equipment) {
        this.highlightZone(equipment.type, false);
      }
    });
    
    this.input.on('drop', (_pointer: Phaser.Input.Pointer, _gameObject: Phaser.GameObjects.GameObject, dropZone: Phaser.GameObjects.Zone) => {
      const equipment = this.equipmentZones.find(e => e.zone === dropZone);
      if (equipment && this.draggedItem) {
        this.handleDrop(equipment.type, this.draggedItem.itemId);
        this.highlightZone(equipment.type, false);
      }
      
      if (this.draggedItem) {
        this.draggedItem.sprite.x = this.draggedItem.originalX;
        this.draggedItem.sprite.y = this.draggedItem.originalY;
        this.draggedItem.sprite.setScale(1);
        this.draggedItem.sprite.setDepth(0);
      }
      
      this.draggedItem = null;
    });
  }

  private highlightZone(type: EquipmentType, highlight: boolean) {
    const equipment = this.equipmentZones.find(z => z.type === type);
    if (!equipment) return;
    
    if (equipment.highlight) {
      equipment.highlight.destroy();
      equipment.highlight = undefined;
    }
    
    if (highlight) {
      const zone = equipment.zone;
      const highlightRect = this.add.rectangle(
        zone.x,
        zone.y,
        zone.width + 10,
        zone.height + 10,
        0x000000,
        0
      );
      highlightRect.setStrokeStyle(4, 0xff6b35);
      equipment.highlight = highlightRect;
    }
  }

  private handleDrop(equipmentType: EquipmentType, itemId: string) {
    const item = ITEMS[itemId];
    if (!item) return;
    
    const inventoryItem = this.inventoryItems.find(i => i.id === itemId);
    if (!inventoryItem || inventoryItem.quantity <= 0) return;
    
    switch (equipmentType) {
      case 'mortar':
        this.handleGrinding(itemId);
        break;
      case 'distiller':
        this.handleDistillation(itemId);
        break;
      case 'cauldron':
        this.handleCauldron(itemId);
        break;
    }
  }

  private handleGrinding(itemId: string) {
    const item = ITEMS[itemId];
    if (!item) return;
    
    const matchingExtract = EXTRACTS.find(e => e.baseItemId === itemId && e.extractType === 'powder');
    
    if (matchingExtract) {
      this.playGrindingAnimation(itemId, () => {
        this.removeFromInventory(itemId, 1);
        this.addToInventory(matchingExtract.id, 1);
        if (this.onItemGrinded) {
          this.onItemGrinded(itemId, matchingExtract.id);
        }
      });
    } else {
      this.showMessage('这个材料无法研磨');
    }
  }

  private handleDistillation(itemId: string) {
    const item = ITEMS[itemId];
    if (!item) return;
    
    const matchingExtract = EXTRACTS.find(
      e => e.baseItemId === itemId && (e.extractType === 'essence' || e.extractType === 'tincture')
    );
    
    if (matchingExtract) {
      this.playDistillationAnimation(itemId, () => {
        this.removeFromInventory(itemId, 1);
        this.addToInventory(matchingExtract.id, 1);
        if (this.onItemDistilled) {
          this.onItemDistilled(itemId, matchingExtract.id);
        }
      });
    } else {
      this.showMessage('这个材料无法蒸馏');
    }
  }

  private handleCauldron(itemId: string) {
    const cauldronZone = this.equipmentZones.find(z => z.type === 'cauldron');
    if (!cauldronZone) return;
    
    if (cauldronZone.items.length >= 4) {
      this.showMessage('炼金釜已满，请先开始调制或清空');
      return;
    }
    
    const item = ITEMS[itemId];
    if (!item) return;
    
    if (item.type !== 'extract' && item.type !== 'fluid') {
      this.showMessage('需要先将材料研磨或蒸馏成提取物');
      return;
    }
    
    cauldronZone.items.push(itemId);
    this.removeFromInventory(itemId, 1);
    
    this.showBubbleEffect(950, 400);
    this.showMessage(`已添加 ${item.name} 到炼金釜`);
  }

  private playGrindingAnimation(_itemId: string, callback: () => void) {
    const mortarX = 250;
    const mortarY = 400;
    
    const effect = this.add.circle(mortarX, mortarY - 20, 30, 0xff6b35, 0.5);
    
    this.tweens.add({
      targets: effect,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      onComplete: () => {
        effect.destroy();
        this.showParticleEffect(mortarX, mortarY, 0x8b6914);
        callback();
        this.showMessage('研磨完成！获得粉末提取物');
      },
    });
  }

  private playDistillationAnimation(_itemId: string, callback: () => void) {
    const distillerX = 600;
    const distillerY = 380;
    
    const steam = this.add.circle(distillerX, distillerY - 50, 15, 0x4a90d9, 0.4);
    
    this.tweens.add({
      targets: steam,
      y: distillerY - 100,
      scale: { from: 1, to: 2 },
      alpha: { from: 0.6, to: 0 },
      duration: 1500,
      repeat: 2,
      onComplete: () => {
        steam.destroy();
        const drop = this.add.circle(distillerX + 120, distillerY - 10, 8, 0x4a90d9, 0.8);
        this.tweens.add({
          targets: drop,
          y: distillerY + 50,
          duration: 500,
          onComplete: () => {
            drop.destroy();
            callback();
            this.showMessage('蒸馏完成！获得精华提取物');
          },
        });
      },
    });
  }

  private showBubbleEffect(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const bubble = this.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y,
        Phaser.Math.Between(5, 15),
        0x7cfc00,
        0.6
      );
      
      this.tweens.add({
        targets: bubble,
        y: y - 50,
        alpha: { from: 0.8, to: 0 },
        duration: Phaser.Math.Between(500, 1000),
        onComplete: () => bubble.destroy(),
      });
    }
  }

  private showParticleEffect(x: number, y: number, color: number) {
    for (let i = 0; i < 10; i++) {
      const particle = this.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y,
        Phaser.Math.Between(2, 6),
        color,
        0.8
      );
      
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: { from: 1, to: 0 },
        duration: 800,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showMessage(text: string) {
    const message = this.add.text(600, 100, text, {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d4af37',
      backgroundColor: '#1f140a',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: message,
      alpha: { from: 0, to: 1 },
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: message,
          alpha: { from: 1, to: 0 },
          duration: 500,
          delay: 2000,
          onComplete: () => message.destroy(),
        });
      },
    });
  }

  private removeFromInventory(itemId: string, quantity: number) {
    const index = this.inventoryItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.inventoryItems[index].quantity -= quantity;
      if (this.inventoryItems[index].quantity <= 0) {
        this.inventoryItems.splice(index, 1);
      }
      this.updateInventoryDisplay();
      if (this.onInventoryUpdate) {
        this.onInventoryUpdate([...this.inventoryItems]);
      }
    }
  }

  private addToInventory(itemId: string, quantity: number) {
    const existing = this.inventoryItems.find(i => i.id === itemId);
    const itemData = ITEMS[itemId];
    
    if (existing) {
      existing.quantity += quantity;
    } else if (itemData) {
      this.inventoryItems.push({ ...itemData, quantity });
    }
    
    this.updateInventoryDisplay();
    if (this.onInventoryUpdate) {
      this.onInventoryUpdate([...this.inventoryItems]);
    }
  }

  public startBrewing() {
    const cauldronZone = this.equipmentZones.find(z => z.type === 'cauldron');
    if (!cauldronZone || cauldronZone.items.length === 0) {
      this.showMessage('请先向炼金釜中添加材料');
      return;
    }
    
    if (this.isBrewing) {
      this.showMessage('正在调制中...');
      return;
    }
    
    this.isBrewing = true;
    if (this.onBrewingStart) {
      this.onBrewingStart();
    }
    
    const cauldronX = 950;
    const cauldronY = 400;
    
    const glow = this.add.circle(cauldronX, cauldronY, 100, 0x7cfc00, 0.3);
    this.tweens.add({
      targets: glow,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0.3, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: 2,
    });
    
    setTimeout(() => {
      this.checkRecipe(cauldronZone.items, [...this.currentSymbols]);
      this.isBrewing = false;
      glow.destroy();
      
      cauldronZone.items = [];
      this.currentSymbols = [null, null, null, null];
      this.updateSymbolDisplay();
    }, 3000);
  }

  private checkRecipe(items: string[], symbols: (SymbolType | null)[]) {
    let matchedRecipe: typeof RECIPES[0] | null = null;
    let isExplosion = false;
    let resultItemId: string | null = null;
    let message = '';
    
    for (const recipe of RECIPES) {
      const recipeItems = recipe.ingredients.map(i => i.itemId);
      const recipeSymbols = recipe.ingredients.map(i => i.symbol);
      
      const itemsMatch = this.arraysMatch(items, recipeItems);
      
      if (itemsMatch) {
        const usedSymbols = symbols.filter(s => s !== null);
        const symbolsMatch = usedSymbols.length === 0 || this.arraysMatch(usedSymbols, recipeSymbols);
        
        if (symbolsMatch) {
          matchedRecipe = recipe;
          break;
        }
      }
    }
    
    if (matchedRecipe) {
      resultItemId = matchedRecipe.resultItemId;
      this.addToInventory(resultItemId, 1);
      message = `调制成功！获得 ${ITEMS[resultItemId]?.name || '神秘药剂'}`;
      
      if (this.onBrewingComplete) {
        this.onBrewingComplete(true, false, resultItemId, message);
      }
      
      this.showSuccessEffect();
    } else {
      const random = Math.random();
      if (random < 0.3) {
        isExplosion = true;
        message = '配方失败！发生了爆炸！';
        this.showExplosionEffect();
      } else {
        message = '配方失败...材料已浪费';
      }
      
      if (this.onBrewingComplete) {
        this.onBrewingComplete(false, isExplosion, null, message);
      }
    }
    
    this.showMessage(message);
  }

  private arraysMatch<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((item, index) => item === sorted2[index]);
  }

  private showSuccessEffect() {
    const cauldronX = 950;
    const cauldronY = 400;
    
    const light = this.add.circle(cauldronX, cauldronY, 80, 0xd4af37, 0.8);
    this.tweens.add({
      targets: light,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 1, to: 0 },
      duration: 1500,
      onComplete: () => light.destroy(),
    });
    
    for (let i = 0; i < 20; i++) {
      const star = this.add.text(
        cauldronX + Phaser.Math.Between(-60, 60),
        cauldronY + Phaser.Math.Between(-60, 60),
        '✨',
        { fontSize: '20px' }
      );
      
      this.tweens.add({
        targets: star,
        y: star.y - 50,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        onComplete: () => star.destroy(),
      });
    }
  }

  private showExplosionEffect() {
    const cauldronX = 950;
    const cauldronY = 400;
    
    const explosion = this.add.circle(cauldronX, cauldronY, 30, 0xff6b35, 0.9);
    this.tweens.add({
      targets: explosion,
      scale: { from: 1, to: 4 },
      alpha: { from: 1, to: 0 },
      duration: 500,
      onComplete: () => explosion.destroy(),
    });
    
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(
        cauldronX,
        cauldronY,
        Phaser.Math.Between(5, 15),
        Phaser.Math.Between(0, 1) ? 0xff6b35 : 0xffcc00,
        0.9
      );
      
      const angle = (Math.PI * 2 / 15) * i;
      const distance = Phaser.Math.Between(80, 150);
      
      this.tweens.add({
        targets: particle,
        x: cauldronX + Math.cos(angle) * distance,
        y: cauldronY + Math.sin(angle) * distance,
        alpha: { from: 1, to: 0 },
        duration: 800,
        onComplete: () => particle.destroy(),
      });
    }
    
    this.cameras.main.shake(200, 0.02);
  }

  private handlePointerUp(_pointer: Phaser.Input.Pointer) {
    if (this.draggedItem) {
      this.draggedItem.sprite.x = this.draggedItem.originalX;
      this.draggedItem.sprite.y = this.draggedItem.originalY;
      this.draggedItem.sprite.setScale(1);
      this.draggedItem.sprite.setDepth(0);
      this.draggedItem = null;
    }
  }

  public clearCauldron() {
    const cauldronZone = this.equipmentZones.find(z => z.type === 'cauldron');
    if (cauldronZone) {
      cauldronZone.items.forEach(itemId => {
        this.addToInventory(itemId, 1);
      });
      cauldronZone.items = [];
      this.currentSymbols = [null, null, null, null];
      this.updateSymbolDisplay();
      this.showMessage('炼金釜已清空，材料已返还');
    }
  }
}
