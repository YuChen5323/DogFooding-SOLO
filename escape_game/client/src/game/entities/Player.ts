import Phaser from 'phaser';
import { audioManager } from '../../services/audio';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed: number = 150;
  private isMoving: boolean = false;
  private currentDirection: 'left' | 'right' | 'up' | 'down' = 'down';
  private walkSoundTimer: number = 0;
  private wasdKeys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  } | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_face');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    } else {
      this.cursors = {
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false },
        space: { isDown: false },
        shift: { isDown: false }
      } as Phaser.Types.Input.Keyboard.CursorKeys;
    }

    this.createAnimations();
    this.setFrame(0);
  }

  private createAnimations() {
    const anims = this.scene.anims;

    const textureKeys = {
      idle_down: 'player_face',
      idle_up: 'player_back',
      idle_left: 'player_left',
      idle_right: 'player_right',
      walk_down: 'player_face',
      walk_up: 'player_back',
      walk_left: 'player_left',
      walk_right: 'player_right'
    };

    for (const [animKey, textureKey] of Object.entries(textureKeys)) {
      if (!anims.exists(animKey)) {
        anims.create({
          key: animKey,
          frames: [{ key: textureKey, frame: 0 }],
          frameRate: 10,
          repeat: -1
        });
      }
    }
  }

  private isUpPressed(): boolean {
    return this.cursors.up?.isDown || this.wasdKeys?.up?.isDown || false;
  }

  private isDownPressed(): boolean {
    return this.cursors.down?.isDown || this.wasdKeys?.down?.isDown || false;
  }

  private isLeftPressed(): boolean {
    return this.cursors.left?.isDown || this.wasdKeys?.left?.isDown || false;
  }

  private isRightPressed(): boolean {
    return this.cursors.right?.isDown || this.wasdKeys?.right?.isDown || false;
  }

  update(delta: number) {
    if (!this.body) return;

    this.setVelocity(0);
    let moving = false;

    if (this.isUpPressed()) {
      this.setVelocityY(-this.speed);
      this.currentDirection = 'up';
      moving = true;
    } else if (this.isDownPressed()) {
      this.setVelocityY(this.speed);
      this.currentDirection = 'down';
      moving = true;
    }

    if (this.isLeftPressed()) {
      this.setVelocityX(-this.speed);
      this.currentDirection = 'left';
      moving = true;
    } else if (this.isRightPressed()) {
      this.setVelocityX(this.speed);
      this.currentDirection = 'right';
      moving = true;
    }

    if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
      this.body.velocity.normalize().scale(this.speed);
    }

    if (moving) {
      if (!this.isMoving) {
        this.isMoving = true;
        audioManager.playSound('footsteps');
      }

      this.walkSoundTimer += delta;
      if (this.walkSoundTimer > 300) {
        this.walkSoundTimer = 0;
      }

      const walkAnim = `walk_${this.currentDirection}`;
      if (this.anims.currentAnim?.key !== walkAnim) {
        this.anims.play(walkAnim);
      }
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        audioManager.stopSound('footsteps');
      }

      const idleAnim = `idle_${this.currentDirection}`;
      if (this.anims.currentAnim?.key !== idleAnim) {
        this.anims.play(idleAnim);
      }
    }
  }

  getDirection(): 'left' | 'right' | 'up' | 'down' {
    return this.currentDirection;
  }

  setPositionFromState(x: number, y: number) {
    this.setPosition(x, y);
  }
}
