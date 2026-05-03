"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TimerMessage } from "@/types";

export interface TimerState {
  id: string;
  name: string;
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

export interface UseTimerReturn {
  timers: TimerState[];
  createTimer: (name: string, duration: number) => string;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  getTimer: (id: string) => TimerState | undefined;
  onTimerComplete?: (timer: TimerState) => void;
}

export function useTimer(): UseTimerReturn {
  const [timers, setTimers] = useState<TimerState[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !workerRef.current) {
      try {
        const workerCode = `
          const timers = new Map();
          
          function tick(timerId) {
            const timer = timers.get(timerId);
            if (!timer || !timer.isRunning || timer.isPaused) return;
            
            timer.remainingTime -= 1;
            
            self.postMessage({
              type: 'TICK',
              timerId,
              payload: { remainingTime: timer.remainingTime }
            });
            
            if (timer.remainingTime <= 0) {
              timer.isRunning = false;
              if (timer.intervalId) {
                clearInterval(timer.intervalId);
              }
              self.postMessage({
                type: 'COMPLETE',
                timerId
              });
            }
          }
          
          self.onmessage = function(e) {
            const { type, timerId, payload } = e.data;
            
            switch (type) {
              case 'CREATE': {
                const duration = payload?.duration || 0;
                timers.set(timerId, {
                  id: timerId,
                  duration,
                  remainingTime: duration,
                  isRunning: false,
                  isPaused: false
                });
                self.postMessage({
                  type: 'CREATED',
                  timerId,
                  payload: { remainingTime: duration }
                });
                break;
              }
              case 'START': {
                const timer = timers.get(timerId);
                if (!timer) return;
                
                timer.isRunning = true;
                timer.isPaused = false;
                
                if (timer.intervalId) {
                  clearInterval(timer.intervalId);
                }
                
                timer.intervalId = setInterval(() => tick(timerId), 1000);
                
                self.postMessage({
                  type: 'STARTED',
                  timerId,
                  payload: { remainingTime: timer.remainingTime }
                });
                break;
              }
              case 'PAUSE': {
                const timer = timers.get(timerId);
                if (!timer) return;
                timer.isPaused = true;
                self.postMessage({
                  type: 'PAUSED',
                  timerId,
                  payload: { remainingTime: timer.remainingTime }
                });
                break;
              }
              case 'RESUME': {
                const timer = timers.get(timerId);
                if (!timer) return;
                timer.isPaused = false;
                self.postMessage({
                  type: 'RESUMED',
                  timerId,
                  payload: { remainingTime: timer.remainingTime }
                });
                break;
              }
              case 'STOP': {
                const timer = timers.get(timerId);
                if (!timer) return;
                timer.isRunning = false;
                timer.isPaused = false;
                if (timer.intervalId) {
                  clearInterval(timer.intervalId);
                }
                self.postMessage({
                  type: 'STOPPED',
                  timerId,
                  payload: { remainingTime: timer.duration }
                });
                break;
              }
              case 'RESET': {
                const timer = timers.get(timerId);
                if (!timer) return;
                timer.isRunning = false;
                timer.isPaused = false;
                timer.remainingTime = timer.duration;
                if (timer.intervalId) {
                  clearInterval(timer.intervalId);
                }
                self.postMessage({
                  type: 'RESET',
                  timerId,
                  payload: { remainingTime: timer.duration }
                });
                break;
              }
            }
          };
        `;

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(workerUrl);

        workerRef.current.onmessage = (e: MessageEvent) => {
          const { type, timerId, payload } = e.data;
          
          setTimers(prev => prev.map(timer => {
            if (timer.id !== timerId) return timer;
            
            switch (type) {
              case 'TICK':
                return { ...timer, remainingTime: payload.remainingTime };
              case 'STARTED':
              case 'RESUMED':
                return { ...timer, isRunning: true, isPaused: false };
              case 'PAUSED':
                return { ...timer, isPaused: true };
              case 'STOPPED':
              case 'RESET':
                return { 
                  ...timer, 
                  isRunning: false, 
                  isPaused: false, 
                  remainingTime: payload.remainingTime,
                  isCompleted: false
                };
              case 'COMPLETE':
                return { ...timer, isRunning: false, isCompleted: true, remainingTime: 0 };
              default:
                return timer;
            }
          }));
        };

        return () => {
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Failed to create timer worker:", error);
      }
    }
  }, []);

  const createTimer = useCallback((name: string, duration: number): string => {
    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTimer: TimerState = {
      id,
      name,
      duration,
      remainingTime: duration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
    };
    
    setTimers(prev => [...prev, newTimer]);
    
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'CREATE',
        timerId: id,
        payload: { duration }
      });
    }
    
    return id;
  }, []);

  const sendWorkerMessage = useCallback((type: string, timerId: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type, timerId });
    }
  }, []);

  const startTimer = useCallback((id: string) => {
    sendWorkerMessage('START', id);
  }, [sendWorkerMessage]);

  const pauseTimer = useCallback((id: string) => {
    sendWorkerMessage('PAUSE', id);
  }, [sendWorkerMessage]);

  const resumeTimer = useCallback((id: string) => {
    sendWorkerMessage('RESUME', id);
  }, [sendWorkerMessage]);

  const stopTimer = useCallback((id: string) => {
    sendWorkerMessage('STOP', id);
  }, [sendWorkerMessage]);

  const resetTimer = useCallback((id: string) => {
    sendWorkerMessage('RESET', id);
  }, [sendWorkerMessage]);

  const getTimer = useCallback((id: string) => {
    return timers.find(t => t.id === id);
  }, [timers]);

  return {
    timers,
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    getTimer,
  };
}
