"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CameraOff, RefreshCw, Scan, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { DetectedIngredient } from "@/types";
import { cn } from "@/lib/utils";

interface IngredientCameraProps {
  onIngredientsDetected?: (ingredients: DetectedIngredient[]) => void;
  className?: string;
}

export function IngredientCamera({
  onIngredientsDetected,
  className,
}: IngredientCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const {
    isInitialized,
    isDetecting,
    detectedIngredients,
    error: detectionError,
    initialize,
    startContinuousDetection,
    stopContinuousDetection,
  } = useObjectDetection();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);

      await initialize();
    } catch (err) {
      const message = err instanceof Error ? err.message : '无法访问摄像头';
      setError(message);
      console.error('Camera error:', err);
    }
  }, [facingMode, initialize]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    stopContinuousDetection();
    setIsCameraActive(false);
    setIsScanning(false);
  }, [stopContinuousDetection]);

  const toggleScanning = useCallback(async () => {
    if (!isInitialized) {
      await initialize();
    }

    if (isDetecting) {
      stopContinuousDetection();
      setIsScanning(false);
    } else {
      if (videoRef.current) {
        startContinuousDetection(videoRef.current);
        setIsScanning(true);
      }
    }
  }, [isInitialized, isDetecting, initialize, startContinuousDetection, stopContinuousDetection]);

  const toggleIngredient = useCallback((ingredientName: string) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientName)) {
        next.delete(ingredientName);
      } else {
        next.add(ingredientName);
      }
      return next;
    });
  }, []);

  const confirmSelection = useCallback(() => {
    const selectedItems = detectedIngredients.filter(
      ing => selectedIngredients.has(ing.name)
    );
    
    if (selectedItems.length > 0 && onIngredientsDetected) {
      onIngredientsDetected(selectedItems);
    }
  }, [detectedIngredients, selectedIngredients, onIngredientsDetected]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraActive) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [isCameraActive, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (detectionError) {
      setError(detectionError);
    }
  }, [detectionError]);

  return (
    <div className={cn("w-full", className)}>
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />

          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <Camera className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-400 text-lg mb-4">点击下方按钮启动摄像头</p>
              <Button
                variant="default"
                size="touch"
                onClick={startCamera}
              >
                <Camera className="w-5 h-5 mr-2" />
                启动摄像头
              </Button>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90">
              <CameraOff className="w-16 h-16 text-red-400 mb-4" />
              <p className="text-red-300 text-lg mb-2">无法访问摄像头</p>
              <p className="text-red-400 text-sm mb-4 max-w-xs text-center">{error}</p>
              <Button
                variant="secondary"
                size="touch"
                onClick={() => {
                  setError(null);
                  startCamera();
                }}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                重试
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <Badge variant="warning" className="text-base px-4 py-2 animate-pulse">
                <Scan className="w-4 h-4 mr-2" />
                正在识别中...
              </Badge>
            </div>
          )}

          {isCameraActive && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
              <Button
                variant={isScanning ? "destructive" : "default"}
                size="touch"
                onClick={toggleScanning}
                disabled={!isInitialized && isScanning === false}
              >
                {isScanning ? (
                  <><X className="w-5 h-5 mr-2" /> 停止识别</>
                ) : (
                  <><Scan className="w-5 h-5 mr-2" /> 开始识别</>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={switchCamera}
              >
                <RefreshCw className="w-6 h-6" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={stopCamera}
              >
                <CameraOff className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>

        {detectedIngredients.length > 0 && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">检测到的食材</h3>
            <p className="text-sm text-gray-500 mb-3">点击选择要用于匹配菜谱的食材</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {detectedIngredients.map((ingredient, index) => (
                <button
                  key={`${ingredient.name}-${index}`}
                  onClick={() => toggleIngredient(ingredient.name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base transition-colors",
                    selectedIngredients.has(ingredient.name)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {selectedIngredients.has(ingredient.name) && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{ingredient.name}</span>
                  <span className="text-xs opacity-70">
                    ({(ingredient.confidence * 100).toFixed(0)}%)
                  </span>
                </button>
              ))}
            </div>

            {selectedIngredients.size > 0 && (
              <Button
                variant="default"
                size="touch"
                className="w-full"
                onClick={confirmSelection}
              >
                用选中的 {selectedIngredients.size} 种食材匹配菜谱
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
