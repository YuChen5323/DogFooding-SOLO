"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  speak: (text: string, options?: SpeakOptions) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  selectChineseVoice: () => void;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        
        if (!selectedVoice) {
          const chineseVoice = availableVoices.find(
            v => v.lang.startsWith("zh") || v.lang.startsWith("cmn")
          );
          if (chineseVoice) {
            setSelectedVoice(chineseVoice);
          } else if (availableVoices.length > 0) {
            setSelectedVoice(availableVoices[0]);
          }
        }
      };

      updateVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = updateVoices;
      }

      return () => {
        if (synthRef.current) {
          synthRef.current.onvoiceschanged = null;
        }
      };
    }
  }, [selectedVoice]);

  const selectChineseVoice = useCallback(() => {
    const chineseVoice = voices.find(
      v => v.lang.startsWith("zh") || v.lang.startsWith("cmn") || v.lang.includes("CN")
    );
    if (chineseVoice) {
      setSelectedVoice(chineseVoice);
    }
  }, [voices]);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!isSupported || !synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = options?.rate ?? rate;
    utterance.pitch = options?.pitch ?? pitch;
    utterance.volume = options?.volume ?? volume;
    
    const voiceToUse = options?.voice ?? selectedVoice;
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      options?.onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setIsPaused(false);
      options?.onError?.(event);
      console.error("Speech synthesis error:", event);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
  }, [isSupported, rate, pitch, volume, selectedVoice]);

  const pause = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.resume();
    }
  }, []);

  const cancel = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const handleSetVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  const handleSetRate = useCallback((newRate: number) => {
    const clampedRate = Math.max(0.1, Math.min(10, newRate));
    setRate(clampedRate);
  }, []);

  const handleSetPitch = useCallback((newPitch: number) => {
    const clampedPitch = Math.max(0, Math.min(2, newPitch));
    setPitch(clampedPitch);
  }, []);

  const handleSetVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  }, []);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    speak,
    pause,
    resume,
    cancel,
    setVoice: handleSetVoice,
    setRate: handleSetRate,
    setPitch: handleSetPitch,
    setVolume: handleSetVolume,
    selectChineseVoice,
  };
}
