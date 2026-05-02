import type { SpectrumData, BeatEvent } from '$lib/types/game';

export class AudioAnalyzer {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private source: AudioBufferSourceNode | MediaElementSourceNode | null = null;
	private gainNode: GainNode | null = null;
	private audioBuffer: AudioBuffer | null = null;
	private audioElement: HTMLAudioElement | null = null;
	private currentTime: number = 0;
	private duration: number = 0;
	private isPlaying: boolean = false;
	private isLooping: boolean = false;
	private onBeatCallback: ((event: BeatEvent) => void) | null = null;
	private onSpectrumCallback: ((data: SpectrumData) => void) | null = null;

	private historySize: number = 20;
	private bassHistory: number[] = [];
	private midHistory: number[] = [];
	private trebleHistory: number[] = [];
	private bassThreshold: number = 0.65;
	private midThreshold: number = 0.6;
	private trebleThreshold: number = 0.55;
	private beatCooldown: number = 150;
	private lastBassBeat: number = 0;
	private lastMidBeat: number = 0;
	private lastTrebleBeat: number = 0;

	private beatEvents: BeatEvent[] = [];
	private lastProcessedBeatIndex: number = -1;

	constructor() {
		this.initContext();
	}

	private initContext(): void {
		if (typeof window !== 'undefined' && !this.audioContext) {
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			if (AudioContextClass) {
				this.audioContext = new AudioContextClass();
				this.analyser = this.audioContext.createAnalyser();
				this.analyser.fftSize = 512;
				this.analyser.smoothingTimeConstant = 0.8;
				this.gainNode = this.audioContext.createGain();
				this.gainNode.connect(this.audioContext.destination);
				this.analyser.connect(this.gainNode);
			}
		}
	}

	async loadFromFile(file: File): Promise<boolean> {
		try {
			this.initContext();
			if (!this.audioContext) return false;

			this.stop();

			const arrayBuffer = await file.arrayBuffer();
			this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			this.duration = this.audioBuffer.duration;
			this.audioElement = null;

			return true;
		} catch (error) {
			console.error('Error loading audio file:', error);
			return false;
		}
	}

	async loadFromUrl(url: string): Promise<boolean> {
		try {
			this.initContext();
			if (!this.audioContext) return false;

			this.stop();

			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			this.duration = this.audioBuffer.duration;
			this.audioElement = null;

			return true;
		} catch (error) {
			console.error('Error loading audio from URL:', error);
			return false;
		}
	}

	loadFromAudioElement(element: HTMLAudioElement): boolean {
		try {
			this.initContext();
			if (!this.audioContext || !this.analyser) return false;

			this.stop();

			this.audioElement = element;
			this.source = this.audioContext.createMediaElementSource(element);
			this.source.connect(this.analyser);
			this.audioBuffer = null;

			this.duration = element.duration || 0;
			element.addEventListener('loadedmetadata', () => {
				this.duration = element.duration;
			});

			return true;
		} catch (error) {
			console.error('Error loading audio element:', error);
			return false;
		}
	}

	async play(startTime: number = 0): Promise<boolean> {
		try {
			if (!this.audioContext) return false;

			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}

			if (this.audioElement) {
				this.audioElement.currentTime = startTime;
				await this.audioElement.play();
				this.isPlaying = true;
				this.currentTime = startTime;
				this.startAnalysisLoop();
				return true;
			}

			if (this.audioBuffer && this.analyser) {
				this.stop();

				this.source = this.audioContext.createBufferSource();
				this.source.buffer = this.audioBuffer;
				this.source.loop = this.isLooping;
				this.source.connect(this.analyser);

				this.source.onended = () => {
					this.isPlaying = false;
				};

				const offset = Math.max(0, Math.min(startTime, this.duration));
				this.source.start(0, offset);
				this.isPlaying = true;
				this.currentTime = offset;
				this.startAnalysisLoop();
				return true;
			}

			return false;
		} catch (error) {
			console.error('Error playing audio:', error);
			return false;
		}
	}

	pause(): void {
		if (this.audioElement) {
			this.audioElement.pause();
		} else if (this.source) {
			try {
				(this.source as AudioBufferSourceNode).stop();
			} catch (e) {
			}
		}
		this.isPlaying = false;
		this.stopAnalysisLoop();
	}

	stop(): void {
		if (this.audioElement) {
			this.audioElement.pause();
			this.audioElement.currentTime = 0;
		} else if (this.source) {
			try {
				(this.source as AudioBufferSourceNode).stop();
			} catch (e) {
			}
		}
		this.isPlaying = false;
		this.currentTime = 0;
		this.lastProcessedBeatIndex = -1;
		this.stopAnalysisLoop();
		this.resetHistory();
	}

	setLoop(loop: boolean): void {
		this.isLooping = loop;
		if (this.source && 'loop' in this.source) {
			(this.source as AudioBufferSourceNode).loop = loop;
		}
	}

	setVolume(volume: number): void {
		if (this.gainNode) {
			this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
		}
	}

	seek(time: number): void {
		const wasPlaying = this.isPlaying;
		this.stop();
		this.currentTime = Math.max(0, Math.min(time, this.duration));

		this.beatEvents.forEach((event) => (event.triggered = event.time < this.currentTime));
		this.lastProcessedBeatIndex = -1;

		if (wasPlaying) {
			this.play(this.currentTime);
		}
	}

	getCurrentTime(): number {
		if (this.audioElement) {
			return this.audioElement.currentTime;
		}
		return this.currentTime;
	}

	getDuration(): number {
		return this.duration;
	}

	getIsPlaying(): boolean {
		return this.isPlaying;
	}

	getAnalyser(): AnalyserNode | null {
		return this.analyser;
	}

	setBeatEvents(events: BeatEvent[]): void {
		this.beatEvents = [...events].sort((a, b) => a.time - b.time);
		this.lastProcessedBeatIndex = -1;
	}

	getBeatEvents(): BeatEvent[] {
		return [...this.beatEvents];
	}

	setOnBeatCallback(callback: (event: BeatEvent) => void): void {
		this.onBeatCallback = callback;
	}

	setOnSpectrumCallback(callback: (data: SpectrumData) => void): void {
		this.onSpectrumCallback = callback;
	}

	private analysisFrameId: number = 0;
	private lastUpdateTime: number = 0;

	private startAnalysisLoop(): void {
		this.stopAnalysisLoop();
		this.lastUpdateTime = performance.now();
		this.animate();
	}

	private stopAnalysisLoop(): void {
		if (this.analysisFrameId) {
			cancelAnimationFrame(this.analysisFrameId);
			this.analysisFrameId = 0;
		}
	}

	private animate(): void {
		if (!this.isPlaying) return;

		const now = performance.now();
		const delta = now - this.lastUpdateTime;
		this.lastUpdateTime = now;

		if (this.audioElement) {
			this.currentTime = this.audioElement.currentTime;
		} else {
			this.currentTime += delta / 1000;
			if (this.currentTime > this.duration) {
				if (this.isLooping) {
					this.currentTime -= this.duration;
					this.lastProcessedBeatIndex = -1;
					this.beatEvents.forEach((event) => (event.triggered = false));
				} else {
					this.isPlaying = false;
					return;
				}
			}
		}

		this.analyzeSpectrum();
		this.checkBeatEvents();

		this.analysisFrameId = requestAnimationFrame(() => this.animate());
	}

	private analyzeSpectrum(): void {
		if (!this.analyser) return;

		const bufferLength = this.analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		this.analyser.getByteFrequencyData(dataArray);

		const bassStart = Math.floor(0 * bufferLength / 8);
		const bassEnd = Math.floor(2 * bufferLength / 8);
		const midStart = bassEnd;
		const midEnd = Math.floor(5 * bufferLength / 8);
		const trebleStart = midEnd;
		const trebleEnd = bufferLength;

		const bass = this.calculateAverage(dataArray, bassStart, bassEnd);
		const mid = this.calculateAverage(dataArray, midStart, midEnd);
		const treble = this.calculateAverage(dataArray, trebleStart, trebleEnd);

		this.bassHistory.push(bass);
		this.midHistory.push(mid);
		this.trebleHistory.push(treble);

		if (this.bassHistory.length > this.historySize) this.bassHistory.shift();
		if (this.midHistory.length > this.historySize) this.midHistory.shift();
		if (this.trebleHistory.length > this.historySize) this.trebleHistory.shift();

		const decibels = this.calculateAverage(dataArray, 0, bufferLength);

		const spectrumData: SpectrumData = {
			bass: bass / 255,
			mid: mid / 255,
			treble: treble / 255,
			fullSpectrum: dataArray,
			decibels: decibels
		};

		if (this.onSpectrumCallback) {
			this.onSpectrumCallback(spectrumData);
		}

		this.detectRealtimeBeats(bass, mid, treble);
	}

	private calculateAverage(array: Uint8Array, start: number, end: number): number {
		let sum = 0;
		for (let i = start; i < end; i++) {
			sum += array[i];
		}
		return sum / (end - start);
	}

	private detectRealtimeBeats(bass: number, mid: number, treble: number): void {
		const now = performance.now();

		const bassAvg = this.bassHistory.reduce((a, b) => a + b, 0) / this.bassHistory.length;
		const midAvg = this.midHistory.reduce((a, b) => a + b, 0) / this.midHistory.length;
		const trebleAvg = this.trebleHistory.reduce((a, b) => a + b, 0) / this.trebleHistory.length;

		if (bass > bassAvg * this.bassThreshold * 1.5 && now - this.lastBassBeat > this.beatCooldown) {
			this.lastBassBeat = now;
			if (this.onBeatCallback) {
				this.onBeatCallback({
					time: this.currentTime,
					strength: bass / 255,
					frequency: 'bass',
					triggered: false
				});
			}
		}

		if (mid > midAvg * this.midThreshold * 1.3 && now - this.lastMidBeat > this.beatCooldown * 0.8) {
			this.lastMidBeat = now;
			if (this.onBeatCallback) {
				this.onBeatCallback({
					time: this.currentTime,
					strength: mid / 255,
					frequency: 'mid',
					triggered: false
				});
			}
		}

		if (treble > trebleAvg * this.trebleThreshold * 1.2 && now - this.lastTrebleBeat > this.beatCooldown * 0.6) {
			this.lastTrebleBeat = now;
			if (this.onBeatCallback) {
				this.onBeatCallback({
					time: this.currentTime,
					strength: treble / 255,
					frequency: 'treble',
					triggered: false
				});
			}
		}
	}

	private checkBeatEvents(): void {
		if (this.beatEvents.length === 0 || !this.onBeatCallback) return;

		for (let i = this.lastProcessedBeatIndex + 1; i < this.beatEvents.length; i++) {
			const event = this.beatEvents[i];
			if (event.time <= this.currentTime && !event.triggered) {
				event.triggered = true;
				this.lastProcessedBeatIndex = i;
				this.onBeatCallback({ ...event });
			} else if (event.time > this.currentTime) {
				break;
			}
		}
	}

	private resetHistory(): void {
		this.bassHistory = [];
		this.midHistory = [];
		this.trebleHistory = [];
	}

	setBeatThresholds(bass: number, mid: number, treble: number): void {
		this.bassThreshold = bass;
		this.midThreshold = mid;
		this.trebleThreshold = treble;
	}

	setHistorySize(size: number): void {
		this.historySize = Math.max(5, Math.min(100, size));
	}

	dispose(): void {
		this.stopAnalysisLoop();
		this.stop();

		if (this.audioElement) {
			this.audioElement.pause();
			this.audioElement = null;
		}

		if (this.analyser) {
			this.analyser.disconnect();
			this.analyser = null;
		}

		if (this.gainNode) {
			this.gainNode.disconnect();
			this.gainNode = null;
		}

		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}

		this.audioBuffer = null;
		this.beatEvents = [];
		this.onBeatCallback = null;
		this.onSpectrumCallback = null;
	}
}
