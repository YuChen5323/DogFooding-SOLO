import { Howl } from 'howler';

type SoundType = 'music' | 'sfx';

interface SoundConfig {
  src: string;
  type: SoundType;
  loop?: boolean;
  volume?: number;
}

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private currentMusic: Howl | null = null;
  private masterVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private isMuted: boolean = false;

  private readonly soundConfigs: Record<string, SoundConfig> = {
    ambient_entrance: {
      src: '/sounds/ambient_entrance.mp3',
      type: 'music',
      loop: true,
      volume: 0.4
    },
    ambient_hall: {
      src: '/sounds/ambient_hall.mp3',
      type: 'music',
      loop: true,
      volume: 0.3
    },
    ambient_secret: {
      src: '/sounds/ambient_secret.mp3',
      type: 'music',
      loop: true,
      volume: 0.5
    },
    footsteps: {
      src: '/sounds/footsteps.mp3',
      type: 'sfx',
      volume: 0.3
    },
    door_open: {
      src: '/sounds/door_open.mp3',
      type: 'sfx',
      volume: 0.6
    },
    door_locked: {
      src: '/sounds/door_locked.mp3',
      type: 'sfx',
      volume: 0.5
    },
    item_pickup: {
      src: '/sounds/item_pickup.mp3',
      type: 'sfx',
      volume: 0.5
    },
    puzzle_solve: {
      src: '/sounds/puzzle_solve.mp3',
      type: 'sfx',
      volume: 0.6
    },
    error: {
      src: '/sounds/error.mp3',
      type: 'sfx',
      volume: 0.4
    },
    achievement: {
      src: '/sounds/achievement.mp3',
      type: 'sfx',
      volume: 0.7
    },
    click: {
      src: '/sounds/click.mp3',
      type: 'sfx',
      volume: 0.3
    },
    transition: {
      src: '/sounds/transition.mp3',
      type: 'sfx',
      volume: 0.4
    }
  };

  setVolumes(master: number, music: number, sfx: number) {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.updateAllVolumes();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateAllVolumes();
  }

  private updateAllVolumes() {
    this.sounds.forEach((sound, id) => {
      const config = this.soundConfigs[id];
      if (config) {
        const baseVolume = config.volume || 1;
        const typeVolume = config.type === 'music' ? this.musicVolume : this.sfxVolume;
        const finalVolume = this.isMuted ? 0 : baseVolume * typeVolume * this.masterVolume;
        sound.volume(finalVolume);
      }
    });
  }

  private loadSound(id: string): Howl | undefined {
    const config = this.soundConfigs[id];
    if (!config) {
      console.warn(`Sound not found: ${id}`);
      return undefined;
    }

    const baseVolume = config.volume || 1;
    const typeVolume = config.type === 'music' ? this.musicVolume : this.sfxVolume;
    const finalVolume = this.isMuted ? 0 : baseVolume * typeVolume * this.masterVolume;

    const howl = new Howl({
      src: [config.src],
      loop: config.loop || false,
      volume: finalVolume,
      onloaderror: (_id, error) => {
        console.warn(`Failed to load sound: ${id}`, error);
      }
    });

    this.sounds.set(id, howl);
    return howl;
  }

  playSound(id: string): number | null {
    let sound = this.sounds.get(id);
    if (!sound) {
      sound = this.loadSound(id);
    }
    if (!sound) return null;

    return sound.play();
  }

  stopSound(id: string) {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
  }

  playMusic(roomId: string) {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, 500);
      setTimeout(() => {
        if (this.currentMusic) {
          this.currentMusic.stop();
        }
      }, 500);
    }

    const musicId = this.getMusicForRoom(roomId);
    if (!musicId) return;

    let music = this.sounds.get(musicId);
    if (!music) {
      music = this.loadSound(musicId);
    }
    if (!music) return;

    music.once('fade', () => {
      if (this.currentMusic === music) {
        music.fade(0, music.volume(), 500);
      }
    });

    music.volume(0);
    music.play();
    music.fade(0, music.volume(), 500);

    this.currentMusic = music;
  }

  private getMusicForRoom(roomId: string): string | null {
    const roomMusicMap: Record<string, string> = {
      entrance: 'ambient_entrance',
      hall: 'ambient_hall',
      library: 'ambient_hall',
      study: 'ambient_hall',
      secret_room: 'ambient_secret'
    };
    return roomMusicMap[roomId] || null;
  }

  stopAllMusic() {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, 500);
      setTimeout(() => {
        if (this.currentMusic) {
          this.currentMusic.stop();
          this.currentMusic = null;
        }
      }, 500);
    }
  }

  pauseAll() {
    this.sounds.forEach((sound) => {
      if (sound.playing()) {
        sound.pause();
      }
    });
  }

  resumeAll() {
    this.sounds.forEach((sound) => {
      if (!sound.playing() && sound.state() === 'loaded') {
        sound.play();
      }
    });
  }
}

export const audioManager = new AudioManager();
