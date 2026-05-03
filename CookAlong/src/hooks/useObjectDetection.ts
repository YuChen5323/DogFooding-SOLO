"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FilesetResolver, ObjectDetector, Detection } from "@mediapipe/tasks-vision";
import { DetectedIngredient } from "@/types";

export interface UseObjectDetectionReturn {
  isInitialized: boolean;
  isDetecting: boolean;
  detectedIngredients: DetectedIngredient[];
  error: string | null;
  initialize: () => Promise<void>;
  detect: (videoElement: HTMLVideoElement) => Promise<DetectedIngredient[]>;
  startContinuousDetection: (videoElement: HTMLVideoElement) => void;
  stopContinuousDetection: () => void;
}

const ingredientMapping: Record<string, string> = {
  'apple': '苹果',
  'banana': '香蕉',
  'orange': '橙子',
  'lemon': '柠檬',
  'lime': '青柠',
  'tomato': '番茄',
  'potato': '土豆',
  'onion': '洋葱',
  'garlic': '大蒜',
  'carrot': '胡萝卜',
  'broccoli': '西兰花',
  'cucumber': '黄瓜',
  'mushroom': '蘑菇',
  'egg': '鸡蛋',
  'cheese': '奶酪',
  'milk': '牛奶',
  'butter': '黄油',
  'bread': '面包',
  'chicken': '鸡肉',
  'meat': '肉',
  'fish': '鱼',
  'sushi': '寿司',
  'pizza': '披萨',
  'cake': '蛋糕',
  'donut': '甜甜圈',
  'hot dog': '热狗',
  'hamburger': '汉堡',
  'sandwich': '三明治',
  'salad': '沙拉',
  'soup': '汤',
  'pasta': '意大利面',
  'rice': '米饭',
  'beans': '豆子',
  'nuts': '坚果',
  'wine': '酒',
  'beer': '啤酒',
  'cup': '杯子',
  'bowl': '碗',
  'spoon': '勺子',
  'fork': '叉子',
  'knife': '刀',
  'bottle': '瓶子',
  'vase': '花瓶',
  'potted plant': '盆栽',
  'book': '书',
  'clock': '钟',
  'scissors': '剪刀',
  'teddy bear': '泰迪熊',
  'hair drier': '吹风机',
  'toothbrush': '牙刷',
  'backpack': '背包',
  'umbrella': '雨伞',
  'handbag': '手提包',
  'tie': '领带',
  'suitcase': '行李箱',
  'frisbee': '飞盘',
  'skis': '滑雪板',
  'snowboard': '滑雪板',
  'sports ball': '球',
  'kite': '风筝',
  'baseball bat': '棒球棒',
  'baseball glove': '棒球手套',
  'skateboard': '滑板',
  'surfboard': '冲浪板',
  'tennis racket': '网球拍',
};

const confidenceThreshold = 0.5;

export function useObjectDetection(): UseObjectDetectionReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isContinuousDetectingRef = useRef(false);

  const mapToIngredient = useCallback((categoryName: string): string => {
    return ingredientMapping[categoryName.toLowerCase()] || categoryName;
  }, []);

  const initialize = useCallback(async () => {
    if (objectDetectorRef.current) {
      return;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
          delegate: "GPU"
        },
        scoreThreshold: confidenceThreshold,
        runningMode: "VIDEO",
        maxResults: 10,
      });

      setIsInitialized(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      setError(`初始化物体检测失败: ${errorMessage}`);
      console.error("Object detection initialization error:", err);
    }
  }, []);

  const detect = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<DetectedIngredient[]> => {
    if (!objectDetectorRef.current) {
      throw new Error("物体检测器未初始化");
    }

    const now = performance.now();
    const detections = objectDetectorRef.current.detectForVideo(videoElement, now);
    
    const ingredients: DetectedIngredient[] = detections.detections
      .filter(d => d.categories.length > 0)
      .map(detection => {
        const category = detection.categories[0];
        return {
          name: mapToIngredient(category.categoryName || "未知"),
          confidence: category.score || 0,
          boundingBox: {
            x: detection.boundingBox?.originX || 0,
            y: detection.boundingBox?.originY || 0,
            width: detection.boundingBox?.width || 0,
            height: detection.boundingBox?.height || 0,
          },
        };
      });

    setDetectedIngredients(ingredients);
    return ingredients;
  }, [mapToIngredient]);

  const startContinuousDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (!objectDetectorRef.current) {
      setError("请先初始化物体检测器");
      return;
    }

    isContinuousDetectingRef.current = true;
    setIsDetecting(true);

    const detectLoop = async () => {
      if (!isContinuousDetectingRef.current || !videoElement) {
        return;
      }

      try {
        await detect(videoElement);
      } catch (err) {
        console.error("Detection error:", err);
      }

      if (isContinuousDetectingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(detectLoop);
  }, [detect]);

  const stopContinuousDetection = useCallback(() => {
    isContinuousDetectingRef.current = false;
    setIsDetecting(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopContinuousDetection();
    };
  }, [stopContinuousDetection]);

  return {
    isInitialized,
    isDetecting,
    detectedIngredients,
    error,
    initialize,
    detect,
    startContinuousDetection,
    stopContinuousDetection,
  };
}
