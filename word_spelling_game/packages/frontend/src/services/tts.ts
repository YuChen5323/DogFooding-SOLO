import { store } from '@/store'

export interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  voice?: SpeechSynthesisVoice | null
}

class TTSService {
  private synth: SpeechSynthesis
  private isEnabled: boolean
  private currentVoice: SpeechSynthesisVoice | null
  private languageMap: Record<string, string> = {
    en: 'en-US',
    ja: 'ja-JP',
    zh: 'zh-CN',
  }

  constructor() {
    this.synth = window.speechSynthesis
    this.isEnabled = true
    this.currentVoice = null
    this.initVoices()
  }

  private initVoices(): void {
    const loadVoices = () => {
      const voices = this.synth.getVoices()
      if (voices.length > 0) {
        const settings = store.getState().settings
        const lang = this.languageMap[settings.language] || 'en-US'
        this.currentVoice = voices.find((v) => v.lang.startsWith(lang)) || voices[0] || null
      }
    }

    loadVoices()
    if ('onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = loadVoices
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  public setVoice(voiceName: string): void {
    const voices = this.synth.getVoices()
    this.currentVoice = voices.find((v) => v.name === voiceName) || null
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices()
  }

  public speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isEnabled) {
        resolve()
        return
      }

      if (!this.synth) {
        reject(new Error('SpeechSynthesis not available'))
        return
      }

      this.synth.cancel()

      const settings = store.getState().settings
      const lang = this.languageMap[settings.language] || 'en-US'

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.currentVoice
      utterance.lang = options.lang || lang
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = this.getVolume(options.volume)

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event.error)

      this.synth.speak(utterance)
    })
  }

  public speakLetter(letter: string): Promise<void> {
    return this.speak(letter, { rate: 1.0 })
  }

  public speakWord(word: string): Promise<void> {
    return this.speak(word, { rate: 0.8 })
  }

  public speakSuccess(): Promise<void> {
    return this.speak('Correct!', { rate: 1.0, pitch: 1.2 })
  }

  public speakError(): Promise<void> {
    return this.speak('Wrong!', { rate: 1.0, pitch: 0.8 })
  }

  private getVolume(volume?: number): number {
    const settings = store.getState().settings
    const volumeMap: Record<string, number> = {
      off: 0,
      low: 0.3,
      medium: 0.6,
      high: 1.0,
    }
    return volume ?? volumeMap[settings.soundEffects] ?? 0.6
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public pause(): void {
    if (this.synth) {
      this.synth.pause()
    }
  }

  public resume(): void {
    if (this.synth) {
      this.synth.resume()
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false
  }
}

export const tts = new TTSService()
export default tts
