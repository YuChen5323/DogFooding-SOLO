"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft,
  Volume2,
  VolumeX,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TimerDisplay } from "@/components/TimerDisplay";
import { RecipeStep, RecipeStepTimer, TimerState } from "@/types";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

interface RecipeStepperProps {
  steps: RecipeStep[];
  onStepComplete?: (step: RecipeStep) => void;
  onComplete?: () => void;
  className?: string;
}

interface StepTimer extends TimerState {
  originalTimer: RecipeStepTimer;
}

export function RecipeStepper({
  steps,
  onStepComplete,
  onComplete,
  className,
}: RecipeStepperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<Map<string, StepTimer>>(new Map());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);

  const {
    isSupported,
    isSpeaking: isTTS speaking,
    speak,
    cancel,
  } = useSpeechSynthesis();

  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    if (currentStep && speechEnabled && isSupported) {
      const textToSpeak = `步骤 ${currentStep.stepNumber}：${currentStep.title}。${currentStep.description}`;
      
      setIsSpeaking(true);
      setSpeakingStep(currentStepIndex);
      
      speak(textToSpeak, {
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingStep(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingStep(null);
        }
      });
    }

    return () => {
      cancel();
    };
  }, [currentStepIndex, currentStep, speechEnabled, isSupported, speak, cancel]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      cancel();
      setIsSpeaking(false);
      setSpeakingStep(null);
      setCurrentStepIndex(index);
    }
  }, [steps.length, cancel]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else if (currentStepIndex === steps.length - 1) {
      onComplete?.();
    }
  }, [currentStepIndex, steps.length, goToStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  const handleMarkComplete = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStepIndex);
    setCompletedSteps(newCompleted);
    
    onStepComplete?.(currentStep);
    
    if (currentStepIndex < steps.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  }, [currentStepIndex, currentStep, completedSteps, steps.length, onStepComplete, handleNext]);

  const toggleSpeech = useCallback(() => {
    const newEnabled = !speechEnabled;
    setSpeechEnabled(newEnabled);
    
    if (!newEnabled) {
      cancel();
      setIsSpeaking(false);
      setSpeakingStep(null);
    }
  }, [speechEnabled, cancel]);

  const replayCurrentStep = useCallback(() => {
    if (currentStep && isSupported) {
      const textToSpeak = `步骤 ${currentStep.stepNumber}：${currentStep.title}。${currentStep.description}`;
      
      setIsSpeaking(true);
      setSpeakingStep(currentStepIndex);
      
      speak(textToSpeak, {
        onEnd: () => {
          setIsSpeaking(false);
          setSpeakingStep(null);
        }
      });
    }
  }, [currentStep, currentStepIndex, isSupported, speak]);

  const getStepStatus = (index: number) => {
    if (completedSteps.has(index)) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            步骤 {currentStepIndex + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10",
                speechEnabled ? "text-blue-600" : "text-gray-400"
              )}
              onClick={toggleSpeech}
            >
              {speechEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors",
                status === 'current' && "bg-blue-50",
                status === 'completed' && "bg-green-50"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors",
                status === 'completed' && "bg-green-500 text-white",
                status === 'current' && "bg-blue-600 text-white",
                status === 'pending' && "bg-gray-200 text-gray-500"
              )}>
                {status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.stepNumber
                )}
              </div>
              <span className={cn(
                "text-xs font-medium truncate max-w-[60px]",
                status === 'current' && "text-blue-600",
                status === 'completed' && "text-green-600",
                status === 'pending' && "text-gray-400"
              )}>
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold",
                completedSteps.has(currentStepIndex) 
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white"
              )}>
                {completedSteps.has(currentStepIndex) ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  currentStep.stepNumber
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
                {speakingStep === currentStepIndex && isSpeaking && (
                  <Badge variant="secondary" className="mt-1">
                    正在朗读中...
                  </Badge>
                )}
              </div>
            </div>
            {isSupported && (
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={replayCurrentStep}
                disabled={isSpeaking && speakingStep === currentStepIndex}
              >
                <Volume2 className={cn(
                  "w-6 h-6",
                  isSpeaking && speakingStep === currentStepIndex && "animate-pulse text-blue-600"
                )} />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 mb-1">小贴士</p>
                  <ul className="space-y-1">
                    {currentStep.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-amber-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep.timers && currentStep.timers.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">本步骤计时器</h4>
              <div className="grid gap-4">
                {currentStep.timers.map((timer) => (
                  <div key={timer.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">{timer.name}</span>
                      <Badge variant="outline">
                        {Math.floor(timer.duration / 60)} 分钟 {timer.duration % 60} 秒
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" className="flex-1">
                        启动
                      </Button>
                      <Button variant="outline" size="sm">
                        重置
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="touch"
          className="flex-1"
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="w-6 h-6 mr-2" />
          上一步
        </Button>

        {!completedSteps.has(currentStepIndex) ? (
          <Button
            variant="default"
            size="touch"
            className="flex-1"
            onClick={handleMarkComplete}
          >
            <CheckCircle2 className="w-6 h-6 mr-2" />
            完成此步骤
          </Button>
        ) : (
          <Button
            variant="default"
            size="touch"
            className="flex-1"
            onClick={handleNext}
            disabled={currentStepIndex === steps.length - 1 && completedSteps.has(currentStepIndex)}
          >
            {currentStepIndex === steps.length - 1 ? (
              "已全部完成"
            ) : (
              <>
                下一步
                <ChevronRight className="w-6 h-6 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      {completedSteps.size === steps.length && (
        <div className="mt-6 p-6 bg-green-50 rounded-xl border-2 border-green-200 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 mb-2">
            🎉 恭喜完成所有步骤！
          </h3>
          <p className="text-green-600">
            您已完成 {steps.length} 个烹饪步骤，享受您的美食吧！
          </p>
        </div>
      )}
    </div>
  );
}
