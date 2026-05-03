"use client";

import React from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatTime, formatTimeShort } from "@/lib/formatters";
import { TimerState } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timer: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  className?: string;
  compact?: boolean;
}

export function TimerDisplay({
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
  className,
  compact = false,
}: TimerDisplayProps) {
  const progress = timer.duration > 0 
    ? ((timer.duration - timer.remainingTime) / timer.duration) * 100 
    : 0;

  const isUrgent = timer.remainingTime <= 10 && timer.isRunning;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        timer.isCompleted ? "bg-green-50 border-green-200" :
        isUrgent ? "bg-red-50 border-red-200 animate-pulse" :
        timer.isRunning ? "bg-blue-50 border-blue-200" :
        "bg-gray-50 border-gray-200",
        className
      )}>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 truncate">{timer.name}</p>
          <p className={cn(
            "text-xl font-mono font-bold",
            isUrgent ? "text-red-600" :
            timer.isCompleted ? "text-green-600" :
            "text-gray-900"
          )}>
            {formatTime(timer.remainingTime)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!timer.isRunning && !timer.isCompleted ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onStart}
            >
              <Play className="h-5 w-5 text-blue-600" />
            </Button>
          ) : timer.isPaused ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onResume}
            >
              <Play className="h-5 w-5 text-blue-600" />
            </Button>
          ) : timer.isRunning ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onPause}
            >
              <Pause className="h-5 w-5 text-amber-600" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onReset}
          >
            <RotateCcw className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-xl border-2 shadow-sm",
      timer.isCompleted ? "bg-green-50 border-green-300" :
      isUrgent ? "bg-red-50 border-red-300" :
      timer.isRunning ? "bg-blue-50 border-blue-300" :
      "bg-white border-gray-200",
      className
    )}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">
          {timer.name}
        </h3>
        <p className="text-sm text-gray-500">
          总时长: {formatTimeShort(timer.duration)}
        </p>
      </div>

      <div className={cn(
        "text-6xl font-mono font-bold text-center mb-6 transition-colors",
        isUrgent ? "text-red-600 animate-pulse" :
        timer.isCompleted ? "text-green-600" :
        "text-gray-900"
      )}>
        {formatTime(timer.remainingTime)}
      </div>

      <Progress
        value={progress}
        className={cn(
          "h-3 mb-6",
          isUrgent ? "bg-red-100" :
          timer.isCompleted ? "bg-green-100" :
          "bg-gray-200"
        )}
      />

      <div className="flex justify-center gap-4">
        {!timer.isRunning && !timer.isCompleted && (
          <Button
            variant="default"
            size="touch"
            className="min-w-[120px] text-lg"
            onClick={onStart}
          >
            <Play className="h-6 w-6 mr-2" />
            开始
          </Button>
        )}

        {timer.isRunning && !timer.isPaused && (
          <Button
            variant="secondary"
            size="touch"
            className="min-w-[120px] text-lg"
            onClick={onPause}
          >
            <Pause className="h-6 w-6 mr-2" />
            暂停
          </Button>
        )}

        {timer.isPaused && (
          <Button
            variant="default"
            size="touch"
            className="min-w-[120px] text-lg"
            onClick={onResume}
          >
            <Play className="h-6 w-6 mr-2" />
            继续
          </Button>
        )}

        {(timer.isRunning || timer.isPaused || timer.isCompleted) && (
          <Button
            variant="outline"
            size="touch"
            className="min-w-[120px] text-lg"
            onClick={onReset}
          >
            <RotateCcw className="h-6 w-6 mr-2" />
            重置
          </Button>
        )}
      </div>

      {timer.isCompleted && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
          <p className="text-green-700 font-semibold text-lg">
            ⏰ 计时器已完成！
          </p>
        </div>
      )}
    </div>
  );
}
