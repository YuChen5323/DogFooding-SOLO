<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { 
    predictSign, 
    clearBuffer, 
    initSignClassifier,
    type PredictionResult
  } from '../lib/models/signClassifier'
  import { provideFeedback, playSound } from '../lib/stores/accessibility'
  import { HAND_CONNECTIONS, type Landmark } from '../lib/types'
  
  let videoElement: HTMLVideoElement | null = null
  let canvasElement: HTMLCanvasElement | null = null
  let overlayCanvas: HTMLCanvasElement | null = null
  
  let isCameraActive = false
  let isModelReady = false
  let isRecognizing = false
  let error: string | null = null
  let loading = true
  
  let currentPrediction: PredictionResult | null = null
  let predictions: PredictionResult[] = []
  let frameCount = 0
  
  let leftHandLandmarks: Landmark[] | null = null
  let rightHandLandmarks: Landmark[] | null = null
  let poseLandmarks: Landmark[] | null = null
  
  let videoStream: MediaStream | null = null
  let animationFrameId: number | null = null
  
  let holisticModule: any = null
  let cameraUtils: any = null
  
  onMount(async () => {
    try {
      await initSignClassifier()
      isModelReady = true
      loading = false
      
      await loadMediaPipe()
    } catch (e: any) {
      error = e?.message || '初始化失败'
      loading = false
      provideFeedback('error')
    }
  })
  
  onDestroy(() => {
    stopCamera()
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
  })
  
  async function loadMediaPipe(): Promise<void> {
    try {
      const HolisticModule = await import('@mediapipe/holistic')
      const CameraUtilsModule = await import('@mediapipe/camera_utils')
      
      const Holistic = HolisticModule.Holistic
      
      holisticModule = new Holistic({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
        }
      })
      
      holisticModule.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false
      })
      
      holisticModule.onResults(onResults)
      
      cameraUtils = CameraUtilsModule
    } catch (e) {
      console.warn('MediaPipe load failed, using demo mode:', e)
    }
  }
  
  async function startCamera(): Promise<void> {
    try {
      error = null
      
      if (!videoElement) return
      
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      videoElement.srcObject = videoStream
      await videoElement.play()
      
      isCameraActive = true
      
      if (holisticModule) {
        const Camera = cameraUtils?.Camera
        if (Camera) {
          const camera = new Camera(videoElement, {
            onFrame: async () => {
              if (holisticModule && isRecognizing) {
                await holisticModule.send({ image: videoElement! })
              }
            },
            width: 640,
            height: 480
          })
          await camera.start()
        } else {
          processFrame()
        }
      } else {
        simulateResults()
      }
      
      playSound('success')
    } catch (e: any) {
      error = '无法访问摄像头: ' + (e?.message || '请确保已授予摄像头权限')
      provideFeedback('error')
    }
  }
  
  function stopCamera(): void {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      videoStream = null
    }
    
    if (videoElement) {
      videoElement.srcObject = null
    }
    
    isCameraActive = false
    isRecognizing = false
    leftHandLandmarks = null
    rightHandLandmarks = null
    poseLandmarks = null
    
    clearBuffer()
    playSound('click')
  }
  
  function toggleRecognition(): void {
    if (!isRecognizing) {
      isRecognizing = true
      clearBuffer()
      predictions = []
      frameCount = 0
      playSound('success')
    } else {
      isRecognizing = false
      playSound('click')
    }
  }
  
  function onResults(results: any): void {
    if (!canvasElement || !overlayCanvas) return
    
    const canvasCtx = canvasElement.getContext('2d')
    if (!canvasCtx) return
    
    const overlayCtx = overlayCanvas.getContext('2d')
    if (!overlayCtx) return
    
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)
    
    overlayCtx.save()
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
    overlayCtx.translate(overlayCanvas.width, 0)
    overlayCtx.scale(-1, 1)
    
    if (results.leftHandLandmarks) {
      leftHandLandmarks = results.leftHandLandmarks
      drawLandmarks(overlayCtx, results.leftHandLandmarks, HAND_CONNECTIONS, '#FF7B3C')
    } else {
      leftHandLandmarks = null
    }
    
    if (results.rightHandLandmarks) {
      rightHandLandmarks = results.rightHandLandmarks
      drawLandmarks(overlayCtx, results.rightHandLandmarks, HAND_CONNECTIONS, '#4ECDC4')
    } else {
      rightHandLandmarks = null
    }
    
    if (results.poseLandmarks) {
      poseLandmarks = results.poseLandmarks
    }
    
    overlayCtx.restore()
    canvasCtx.restore()
    
    if (isRecognizing) {
      processForPrediction(results)
    }
  }
  
  async function processFrame(): Promise<void> {
    if (!videoElement || !canvasElement || !overlayCanvas) return
    
    const canvasCtx = canvasElement.getContext('2d')
    if (!canvasCtx) return
    
    const overlayCtx = overlayCanvas.getContext('2d')
    if (!overlayCtx) return
    
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.save()
    canvasCtx.translate(canvasElement.width, 0)
    canvasCtx.scale(-1, 1)
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.restore()
    
    if (isRecognizing) {
      const prediction = await predictSign()
      currentPrediction = prediction
      frameCount++
      
      if (prediction.isFinal) {
        predictions.unshift(prediction)
        if (predictions.length > 5) {
          predictions.pop()
        }
        provideFeedback('success')
      }
    }
    
    animationFrameId = requestAnimationFrame(processFrame)
  }
  
  function simulateResults(): void {
    if (!videoElement || !canvasElement || !overlayCanvas) return
    
    const canvasCtx = canvasElement.getContext('2d')
    const overlayCtx = overlayCanvas.getContext('2d')
    
    if (!canvasCtx || !overlayCtx) return
    
    async function render(): Promise<void> {
      if (!isCameraActive) return
      
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
      canvasCtx.save()
      canvasCtx.translate(canvasElement.width, 0)
      canvasCtx.scale(-1, 1)
      canvasCtx.drawImage(videoElement!, 0, 0, canvasElement!.width, canvasElement!.height)
      canvasCtx.restore()
      
      if (isRecognizing) {
        const prediction = await predictSign()
        currentPrediction = prediction
        frameCount++
        
        if (prediction.isFinal) {
          predictions.unshift(prediction)
          if (predictions.length > 5) {
            predictions.pop()
          }
          provideFeedback('success')
        }
      }
      
      animationFrameId = requestAnimationFrame(render)
    }
    
    render()
  }
  
  async function processForPrediction(results: any): Promise<void> {
    const prediction = await predictSign()
    currentPrediction = prediction
    frameCount++
    
    if (prediction.isFinal) {
      predictions.unshift(prediction)
      if (predictions.length > 5) {
        predictions.pop()
      }
      provideFeedback('success')
    }
  }
  
  function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    connections: [number, number][],
    color: string
  ): void {
    if (!landmarks) return
    
    const width = overlayCanvas?.width || 640
    const height = overlayCanvas?.height || 480
    
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    for (const [startIdx, endIdx] of connections) {
      const start = landmarks[startIdx]
      const end = landmarks[endIdx]
      if (!start || !end) continue
      
      ctx.beginPath()
      ctx.moveTo(start.x * width, start.y * height)
      ctx.lineTo(end.x * width, end.y * height)
      ctx.stroke()
    }
    
    ctx.fillStyle = color
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i]
      if (!landmark) continue
      
      ctx.beginPath()
      ctx.arc(
        landmark.x * width,
        landmark.y * height,
        4,
        0,
        2 * Math.PI
      )
      ctx.fill()
    }
  }
  
  function clearHistory(): void {
    predictions = []
    currentPrediction = null
    clearBuffer()
    frameCount = 0
    playSound('click')
  }
  
  $: confidencePercentage = currentPrediction 
    ? Math.round(currentPrediction.confidence * 100) 
    : 0
</script>

<svelte:head>
  <title>手语识别 - SignFlow</title>
</svelte:head>

<div class="recognize-page">
  <header class="page-header">
    <h1 class="page-title">手语识别</h1>
    <p class="page-subtitle">使用摄像头实时识别手语</p>
  </header>

  {#if loading}
    <div class="loading-container" role="status" aria-live="polite">
      <div class="spinner"></div>
      <p>加载模型中...</p>
    </div>
  {:else if error}
    <div class="error-container" role="alert">
      <p class="error-text">{error}</p>
      <button class="btn btn-primary" on:click={() => { error = null; loading = true; onMount(); }}>
        重试
      </button>
    </div>
  {:else}
    <div class="camera-section">
      <div class="video-container">
        <video
          bind:this={videoElement}
          class="video-element"
          playsinline
          muted
          aria-hidden="true"
        />
        <canvas
          bind:this={canvasElement}
          class="canvas-element"
          width={640}
          height={480}
          aria-hidden="true"
        />
        <canvas
          bind:this={overlayCanvas}
          class="canvas-element overlay"
          width={640}
          height={480}
          aria-hidden="true"
        />
        
        {#if !isCameraActive}
          <div class="camera-overlay">
            <div class="overlay-content">
              <div class="camera-icon">📷</div>
              <p>点击下方按钮开启摄像头</p>
            </div>
          </div>
        {/if}
        
        {#if currentPrediction && isRecognizing}
          <div class="prediction-overlay">
            <div class="current-prediction">
              <span class="prediction-label">{currentPrediction.label}</span>
              <span class="prediction-confidence {confidencePercentage > 70 ? 'high' : confidencePercentage > 50 ? 'medium' : 'low'}">
                {confidencePercentage}%
              </span>
            </div>
            {#if currentPrediction.topK.length > 0}
              <div class="top-predictions">
                {#each currentPrediction.topK.slice(1) as pred}
                  <div class="top-item">
                    <span>{pred.label}</span>
                    <span>{Math.round(pred.confidence * 100)}%</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        {#if isRecognizing}
          <div class="recording-indicator">
            <span class="recording-dot pulse"></span>
            <span>识别中</span>
            <span class="frame-count">{frameCount} 帧</span>
          </div>
        {/if}
      </div>
      
      <div class="controls">
        {#if !isCameraActive}
          <button 
            class="btn btn-primary btn-lg"
            on:click={startCamera}
            disabled={!isModelReady}
          >
            📷 开启摄像头
          </button>
        {:else}
          <button 
            class="btn {isRecognizing ? 'btn-secondary' : 'btn-primary'}"
            on:click={toggleRecognition}
          >
            {isRecognizing ? '⏸ 暂停识别' : '▶ 开始识别'}
          </button>
          <button 
            class="btn btn-outline"
            on:click={clearHistory}
          >
            🗑 清除历史
          </button>
          <button 
            class="btn btn-outline"
            on:click={stopCamera}
          >
            ❌ 关闭摄像头
          </button>
        {/if}
      </div>
    </div>

    {#if predictions.length > 0}
      <section class="history-section">
        <h2 class="section-title">识别历史</h2>
        <div class="history-list">
          {#each predictions as pred, index}
            <div class="history-item card">
              <div class="history-word">{pred.label}</div>
              <div class="history-meta">
                <span class="confidence" style="color: {pred.confidence > 0.7 ? 'var(--success)' : pred.confidence > 0.5 ? 'var(--warning)' : 'var(--error)'}">
                  {Math.round(pred.confidence * 100)}%
                </span>
                <span class="timestamp">
                  {new Date(pred.timestamp).toLocaleTimeString('zh-CN')}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="info-section card">
      <h3 class="info-title">使用说明</h3>
      <ul class="info-list">
        <li>点击"开启摄像头"允许访问设备摄像头</li>
        <li>确保光线充足，双手在画面中清晰可见</li>
        <li>点击"开始识别"进行实时手语识别</li>
        <li>画面中会实时显示手部骨骼关键点</li>
        <li>识别结果会显示在画面顶部</li>
      </ul>
    </section>
  {/if}
</div>

<style>
  .recognize-page {
    padding: var(--spacing-lg);
    padding-bottom: var(--spacing-xl);
  }
  
  .page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
  }
  
  .page-subtitle {
    color: var(--text-muted);
    font-size: var(--font-size-md);
  }
  
  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--bg-hover);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-container {
    color: var(--error);
  }
  
  .error-text {
    text-align: center;
  }
  
  .camera-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }
  
  .video-container {
    position: relative;
    width: 100%;
    max-width: 640px;
    aspect-ratio: 4 / 3;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  
  .video-element,
  .canvas-element {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .video-element {
    transform: scaleX(-1);
  }
  
  .canvas-element.overlay {
    pointer-events: none;
  }
  
  .camera-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10;
  }
  
  .overlay-content {
    text-align: center;
    color: var(--text-primary);
  }
  
  .camera-icon {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
  }
  
  .prediction-overlay {
    position: absolute;
    top: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius);
    padding: var(--spacing-md) var(--spacing-lg);
    z-index: 20;
    min-width: 200px;
    text-align: center;
  }
  
  .current-prediction {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
  }
  
  .prediction-label {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .prediction-confidence {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .prediction-confidence.high {
    color: var(--success);
  }
  
  .prediction-confidence.medium {
    color: var(--warning);
  }
  
  .prediction-confidence.low {
    color: var(--error);
  }
  
  .top-predictions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .top-item {
    display: flex;
    justify-content: space-between;
  }
  
  .recording-indicator {
    position: absolute;
    bottom: var(--spacing-md);
    left: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: rgba(0, 0, 0, 0.7);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    z-index: 20;
  }
  
  .recording-dot {
    width: 8px;
    height: 8px;
    background: var(--error);
    border-radius: 50%;
  }
  
  .frame-count {
    color: var(--text-muted);
  }
  
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    justify-content: center;
  }
  
  .btn-lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
  }
  
  .history-section {
    margin-top: var(--spacing-xl);
  }
  
  .history-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
  
  .history-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .history-word {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .history-meta {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .info-section {
    margin-top: var(--spacing-xl);
  }
  
  .info-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-md);
  }
  
  .info-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .info-list li {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    color: var(--text-muted);
  }
  
  .info-list li::before {
    content: '•';
    color: var(--primary);
    font-weight: bold;
  }
  
  @media (min-width: 769px) {
    .recognize-page {
      padding: var(--spacing-xl);
    }
    
    .video-container {
      max-width: 800px;
    }
  }
</style>
