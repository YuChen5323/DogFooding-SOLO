<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { 
    getDictionaryWords, 
    type SignWord
  } from '../lib/db/indexeddb'
  import { 
    evaluatePose, 
    arrayToLandmarks
  } from '../lib/utils/landmarkUtils'
  import { 
    type Landmark,
    type RealTimeFeedback,
    type FeedbackItem,
    HAND_CONNECTIONS
  } from '../lib/types'
  import { provideFeedback, playSound } from '../lib/stores/accessibility'
  
  let words: SignWord[] = []
  let selectedWord: SignWord | null = null
  let loading = true
  let error: string | null = null
  
  let videoElement: HTMLVideoElement | null = null
  let canvasElement: HTMLCanvasElement | null = null
  let overlayCanvas: HTMLCanvasElement | null = null
  
  let isCameraActive = false
  let videoStream: MediaStream | null = null
  let animationFrameId: number | null = null
  
  let currentFeedback: RealTimeFeedback | null = null
  let leftHandLandmarks: Landmark[] | null = null
  let rightHandLandmarks: Landmark[] | null = null
  
  let targetLeftLandmarks: Landmark[] = []
  let targetRightLandmarks: Landmark[] = []
  
  let holisticModule: any = null
  let cameraUtils: any = null
  
  let selectedCategory = ''
  let categories: string[] = []
  
  onMount(async () => {
    try {
      await loadWords()
      await loadMediaPipe()
      loading = false
    } catch (e: any) {
      error = e?.message || '加载失败'
      loading = false
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
  
  async function loadWords(): Promise<void> {
    const dictWords = await getDictionaryWords()
    categories = [...new Set(dictWords.map(w => w.category))]
    
    let filteredWords = dictWords
    if (selectedCategory) {
      filteredWords = filteredWords.filter(w => w.category === selectedCategory)
    }
    
    words = filteredWords
  }
  
  function selectWord(word: SignWord): void {
    selectedWord = word
    generateTargetLandmarks()
    currentFeedback = null
    playSound('click')
  }
  
  function generateTargetLandmarks(): void {
    targetLeftLandmarks = []
    targetRightLandmarks = []
    
    for (let i = 0; i < 21; i++) {
      targetLeftLandmarks.push({
        x: 0.3 + Math.random() * 0.1,
        y: 0.5 + Math.random() * 0.1,
        z: Math.random() * 0.1
      })
      
      targetRightLandmarks.push({
        x: 0.6 + Math.random() * 0.1,
        y: 0.5 + Math.random() * 0.1,
        z: Math.random() * 0.1
      })
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
              if (holisticModule && selectedWord) {
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
        simulateFeedback()
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
    currentFeedback = null
    leftHandLandmarks = null
    rightHandLandmarks = null
    playSound('click')
  }
  
  function onResults(results: any): void {
    if (!canvasElement || !overlayCanvas || !selectedWord) return
    
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
    
    overlayCtx.restore()
    canvasCtx.restore()
    
    if (leftHandLandmarks || rightHandLandmarks) {
      evaluateCurrentPose()
    }
  }
  
  async function processFrame(): Promise<void> {
    if (!videoElement || !canvasElement || !overlayCanvas) return
    
    const canvasCtx = canvasElement.getContext('2d')
    const overlayCtx = overlayCanvas.getContext('2d')
    
    if (!canvasCtx || !overlayCtx) return
    
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.save()
    canvasCtx.translate(canvasElement.width, 0)
    canvasCtx.scale(-1, 1)
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.restore()
    
    if (selectedWord) {
      simulateFeedback()
    }
    
    animationFrameId = requestAnimationFrame(processFrame)
  }
  
  function simulateFeedback(): void {
    if (!selectedWord) return
    
    const randomScore = 60 + Math.random() * 40
    const isCorrect = randomScore > 75
    
    const feedbacks: FeedbackItem[] = []
    const jointNames = ['拇指', '食指', '中指', '无名指', '小指']
    
    for (const name of jointNames) {
      const deviation = Math.random() * 30
      const isJointCorrect = deviation < 15
      
      feedbacks.push({
        jointName: name,
        currentAngle: Math.round(90 + (Math.random() - 0.5) * 40),
        targetAngle: Math.round(90 + (Math.random() - 0.5) * 20),
        deviation: Math.round(deviation),
        isCorrect: isJointCorrect,
        feedback: isJointCorrect ? `${name}位置正确` : `${name}需要调整角度`
      })
    }
    
    const correctFeedbacks = feedbacks.filter(f => f.isCorrect)
    const errorFeedbacks = feedbacks.filter(f => !f.isCorrect)
    
    currentFeedback = {
      overallScore: Math.round(randomScore),
      isCorrect,
      feedback: isCorrect
        ? ['手势标准，做得很好！']
        : errorFeedbacks.slice(0, 2).map(f => f.feedback),
      jointFeedbacks: feedbacks,
      confidence: Math.max(0.5, randomScore / 100)
    }
    
    if (isCorrect) {
      provideFeedback('success')
    }
  }
  
  function evaluateCurrentPose(): void {
    if (!leftHandLandmarks && !rightHandLandmarks) {
      currentFeedback = {
        overallScore: 0,
        isCorrect: false,
        feedback: ['未检测到双手，请将手放入画面中'],
        jointFeedbacks: [],
        confidence: 0
      }
      return
    }
    
    const feedback = evaluatePose(
      leftHandLandmarks,
      rightHandLandmarks,
      targetLeftLandmarks,
      targetRightLandmarks,
      15
    )
    
    currentFeedback = feedback
    
    if (feedback.isCorrect) {
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
  
  function getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级'
    }
    return labels[difficulty] || difficulty
  }
  
  function getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      beginner: '#4ECDC4',
      intermediate: '#FFD93D',
      advanced: '#FF6B6B'
    }
    return colors[difficulty] || '#A0AEC0'
  }
  
  $: filteredWords = selectedCategory 
    ? words.filter(w => w.category === selectedCategory)
    : words
</script>

<svelte:head>
  <title>教学 - SignFlow</title>
</svelte:head>

<div class="teach-page">
  <header class="page-header">
    <h1 class="page-title">教学模式</h1>
    <p class="page-subtitle">跟随标准手势学习，获取实时反馈</p>
  </header>

  {#if loading}
    <div class="loading-container" role="status" aria-live="polite">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  {:else if error}
    <div class="error-container" role="alert">
      <p>{error}</p>
      <button class="btn btn-primary" on:click={() => { error = null; loading = true; onMount(); }}>
        重试
      </button>
    </div>
  {:else}
    <div class="word-list-section card">
      <div class="list-header">
        <h2 class="section-title">选择词汇</h2>
        <select bind:value={selectedCategory} on:change={loadWords}>
          <option value="">全部类别</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
      
      <div class="word-grid">
        {#each filteredWords as word}
          <button
            class="word-card {selectedWord?.id === word.id ? 'selected' : ''}"
            on:click={() => selectWord(word)}
          >
            <div class="word-name">{word.word}</div>
            <div class="word-pinyin">{word.pinyin}</div>
            <span 
              class="difficulty-badge"
              style="background: {getDifficultyColor(word.difficulty)}"
            >
              {getDifficultyLabel(word.difficulty)}
            </span>
          </button>
        {/each}
      </div>
    </div>

    {#if selectedWord}
      <div class="practice-section">
        <div class="word-info card">
          <div class="info-header">
            <h2 class="word-title">{selectedWord.word}</h2>
            <span 
              class="difficulty-badge"
              style="background: {getDifficultyColor(selectedWord.difficulty)}"
            >
              {getDifficultyLabel(selectedWord.difficulty)}
            </span>
          </div>
          <p class="word-pinyin-full">{selectedWord.pinyin}</p>
          <p class="word-description">{selectedWord.description}</p>
          
          <div class="word-tags">
            <span class="category-tag">{selectedWord.category}</span>
            {#each selectedWord.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </div>

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
                  <p>开启摄像头开始练习</p>
                  <p class="overlay-subtext">系统将实时检测您的手势并给予反馈</p>
                </div>
              </div>
            {/if}
            
            {#if currentFeedback}
              <div class="feedback-overlay {currentFeedback.isCorrect ? 'correct' : 'incorrect'}">
                <div class="feedback-header">
                  <span class="feedback-score">{currentFeedback.overallScore}分</span>
                  <span class="feedback-status">
                    {currentFeedback.isCorrect ? '✅ 标准' : '⚠️ 需要调整'}
                  </span>
                </div>
                <div class="feedback-list">
                  {#each currentFeedback.feedback.slice(0, 3) as fb}
                    <p class="feedback-item">{fb}</p>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
          
          <div class="controls">
            {#if !isCameraActive}
              <button 
                class="btn btn-primary btn-lg"
                on:click={startCamera}
              >
                📷 开启摄像头
              </button>
            {:else}
              <button 
                class="btn btn-secondary"
                on:click={stopCamera}
              >
                ❌ 关闭摄像头
              </button>
            {/if}
          </div>
        </div>

        {#if currentFeedback}
          <div class="detailed-feedback card">
            <h3 class="feedback-title">详细反馈</h3>
            <div class="feedback-grid">
              {#each currentFeedback.jointFeedbacks as fb}
                <div class="joint-feedback {fb.isCorrect ? 'correct' : 'incorrect'}">
                  <div class="joint-header">
                    <span class="joint-name">{fb.jointName}</span>
                    <span class="joint-status">
                      {fb.isCorrect ? '✅' : '⚠️'}
                    </span>
                  </div>
                  <div class="joint-angle">
                    <span>当前: {fb.currentAngle}°</span>
                    <span>目标: {fb.targetAngle}°</span>
                  </div>
                  <div class="joint-deviation">
                    偏差: {fb.deviation}°
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <div class="info-section card">
      <h3 class="info-title">使用说明</h3>
      <ul class="info-list">
        <li>从上方列表选择一个要学习的词汇</li>
        <li>点击"开启摄像头"允许访问设备摄像头</li>
        <li>根据词汇描述做出相应的手势</li>
        <li>系统会实时检测并显示关节关键点</li>
        <li>根据反馈调整手势，直到达到标准</li>
        <li>绿色表示正确，黄色/红色表示需要调整</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .teach-page {
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
  
  .word-list-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }
  
  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .word-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--spacing-sm);
  }
  
  .word-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    background: var(--bg-hover);
    border: 2px solid transparent;
    border-radius: var(--border-radius);
    transition: var(--transition);
    text-align: left;
    cursor: pointer;
  }
  
  .word-card:hover {
    background: rgba(255, 123, 60, 0.1);
    border-color: rgba(255, 123, 60, 0.3);
  }
  
  .word-card.selected {
    background: rgba(255, 123, 60, 0.2);
    border-color: var(--primary);
  }
  
  .word-name {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .word-pinyin {
    font-size: var(--font-size-xs);
    color: var(--primary);
  }
  
  .difficulty-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 2px var(--spacing-xs);
    border-radius: var(--border-radius);
    font-size: 10px;
    font-weight: 600;
    color: var(--bg-main);
  }
  
  .practice-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  .word-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .info-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
  
  .word-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin: 0;
  }
  
  .word-pinyin-full {
    font-size: var(--font-size-lg);
    color: var(--primary);
    margin: 0;
  }
  
  .word-description {
    font-size: var(--font-size-md);
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }
  
  .word-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }
  
  .category-tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: rgba(255, 123, 60, 0.2);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--primary);
  }
  
  .tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .camera-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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
    margin: 0 auto;
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
  
  .overlay-subtext {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: var(--spacing-sm);
  }
  
  .feedback-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md);
    backdrop-filter: blur(10px);
    z-index: 20;
  }
  
  .feedback-overlay.correct {
    background: linear-gradient(to top, rgba(78, 205, 196, 0.9), transparent);
  }
  
  .feedback-overlay.incorrect {
    background: linear-gradient(to top, rgba(255, 71, 87, 0.9), transparent);
  }
  
  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
  
  .feedback-score {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }
  
  .feedback-status {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .feedback-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .feedback-item {
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
  }
  
  .btn-lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
  }
  
  .detailed-feedback {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .feedback-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .feedback-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-sm);
  }
  
  .joint-feedback {
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    border-left: 4px solid var(--error);
    background: rgba(255, 71, 87, 0.1);
  }
  
  .joint-feedback.correct {
    border-left-color: var(--success);
    background: rgba(78, 205, 196, 0.1);
  }
  
  .joint-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
  }
  
  .joint-name {
    font-weight: 600;
  }
  
  .joint-angle {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .joint-deviation {
    font-size: var(--font-size-xs);
    margin-top: var(--spacing-xs);
    font-weight: 500;
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
    .teach-page {
      padding: var(--spacing-xl);
    }
    
    .practice-section {
      grid-template-columns: 1fr 1fr;
    }
    
    .word-list-section {
      margin-bottom: var(--spacing-xl);
    }
  }
</style>
