<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getDueProgress, 
    getDictionaryWords, 
    getWordById,
    updateProgressAfterPractice,
    type SignWord,
    type PracticeProgress
  } from '../lib/db/indexeddb'
  import { provideFeedback, playSound } from '../lib/stores/accessibility'
  
  interface PracticeWord {
    word: SignWord
    progress?: PracticeProgress
  }
  
  let dueWords: PracticeWord[] = []
  let allWords: SignWord[] = []
  let currentWordIndex = 0
  let isPracticing = false
  let loading = true
  let error: string | null = null
  
  let showAnswer = false
  let currentFeedback: 'correct' | 'incorrect' | null = null
  let practiceComplete = false
  
  let selectedCategory = ''
  let selectedDifficulty = ''
  let categories: string[] = []
  
  onMount(async () => {
    try {
      await loadData()
      loading = false
    } catch (e: any) {
      error = e?.message || '加载失败'
      loading = false
    }
  })
  
  async function loadData(): Promise<void> {
    const [dueProgress, dictWords] = await Promise.all([
      getDueProgress(),
      getDictionaryWords()
    ])
    
    categories = [...new Set(dictWords.map(w => w.category))]
    
    const dueSet = new Set(dueProgress.map(p => p.wordId))
    
    let availableWords = dictWords
    if (selectedCategory) {
      availableWords = availableWords.filter(w => w.category === selectedCategory)
    }
    if (selectedDifficulty) {
      availableWords = availableWords.filter(w => w.difficulty === selectedDifficulty)
    }
    
    const priorityWords: PracticeWord[] = []
    const otherWords: PracticeWord[] = []
    
    for (const word of availableWords) {
      if (dueSet.has(word.id)) {
        const progress = dueProgress.find(p => p.wordId === word.id)
        priorityWords.push({ word, progress })
      } else {
        otherWords.push({ word })
      }
    }
    
    dueWords = [...priorityWords, ...otherWords].slice(0, 15)
    allWords = dictWords
  }
  
  function startPractice(): void {
    if (dueWords.length === 0) {
      provideFeedback('warning')
      return
    }
    
    currentWordIndex = 0
    isPracticing = true
    showAnswer = false
    currentFeedback = null
    practiceComplete = false
    playSound('success')
  }
  
  function showHint(): void {
    showAnswer = !showAnswer
    playSound('click')
  }
  
  async function markAnswer(correct: boolean): Promise<void> {
    const current = dueWords[currentWordIndex]
    if (!current) return
    
    try {
      await updateProgressAfterPractice(
        current.word.id,
        correct,
        correct ? 0.9 : 0.3
      )
      
      currentFeedback = correct ? 'correct' : 'incorrect'
      provideFeedback(correct ? 'success' : 'error')
      
      setTimeout(() => {
        if (currentWordIndex < dueWords.length - 1) {
          currentWordIndex++
          showAnswer = false
          currentFeedback = null
        } else {
          practiceComplete = true
          isPracticing = false
          provideFeedback('success')
        }
      }, 1000)
    } catch (e) {
      console.error('Failed to update progress:', e)
    }
  }
  
  async function refreshDue(): Promise<void> {
    try {
      loading = true
      await loadData()
      loading = false
    } catch (e: any) {
      error = e?.message || '刷新失败'
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
  
  $: currentWord = dueWords[currentWordIndex]
</script>

<svelte:head>
  <title>练习 - SignFlow</title>
</svelte:head>

<div class="practice-page">
  <header class="page-header">
    <h1 class="page-title">练习模式</h1>
    <p class="page-subtitle">使用间隔重复算法巩固手语词汇</p>
  </header>

  {#if loading}
    <div class="loading-container" role="status" aria-live="polite">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  {:else if error}
    <div class="error-container" role="alert">
      <p>{error}</p>
      <button class="btn btn-primary" on:click={refreshDue}>重试</button>
    </div>
  {:else if !isPracticing && !practiceComplete}
    <div class="setup-section">
      <div class="filters card">
        <h2 class="filter-title">筛选条件</h2>
        <div class="filter-row">
          <div class="input-group">
            <label for="category">类别</label>
            <select 
              id="category"
              bind:value={selectedCategory}
              on:change={loadData}
            >
              <option value="">全部类别</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
          
          <div class="input-group">
            <label for="difficulty">难度</label>
            <select 
              id="difficulty"
              bind:value={selectedDifficulty}
              on:change={loadData}
            >
              <option value="">全部难度</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>
        </div>
      </div>

      <div class="due-summary card">
        <h2 class="summary-title">今日待复习</h2>
        {#if dueWords.length > 0}
          <div class="due-count">
            <span class="count">{dueWords.length}</span>
            <span class="label">个词汇</span>
          </div>
          <p class="summary-text">基于间隔重复算法，这些词汇需要您复习</p>
          
          <div class="due-list">
            {#each dueWords.slice(0, 5) as item}
              <div class="due-item">
                <span class="word">{item.word.word}</span>
                <span class="pinyin">{item.word.pinyin}</span>
                {#if item.progress}
                  <span class="streak">🔥 {item.progress.streak} 天</span>
                {/if}
              </div>
            {/each}
            {#if dueWords.length > 5}
              <div class="more">还有 {dueWords.length - 5} 个...</div>
            {/if}
          </div>
        {:else}
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <p>太棒了！今天没有需要复习的词汇</p>
            <p class="subtext">可以选择从词典中学习新词汇</p>
          </div>
        {/if}
      </div>

      <div class="action-bar">
        <button 
          class="btn btn-primary btn-lg"
          on:click={startPractice}
          disabled={dueWords.length === 0}
        >
          {dueWords.length > 0 ? '开始练习' : '暂无可练习词汇'}
        </button>
        <button class="btn btn-outline" on:click={refreshDue}>
          🔄 刷新列表
        </button>
      </div>
    </div>
  {:else if practiceComplete}
    <div class="complete-section card">
      <div class="complete-icon">🎉</div>
      <h2 class="complete-title">练习完成！</h2>
      <p class="complete-text">您已完成今日的练习任务</p>
      <div class="complete-stats">
        <div class="stat">
          <span class="stat-value">{dueWords.length}</span>
          <span class="stat-label">复习词汇</span>
        </div>
      </div>
      <div class="action-bar">
        <button class="btn btn-primary" on:click={refreshDue}>
          🔄 再练一组
        </button>
      </div>
    </div>
  {:else if currentWord}
    <div class="practice-section">
      <div class="progress-bar-container">
        <div class="progress-info">
          <span>进度</span>
          <span>{currentWordIndex + 1} / {dueWords.length}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            style="width: {((currentWordIndex + 1) / dueWords.length) * 100}%"
          ></div>
        </div>
      </div>

      <div class="card practice-card {currentFeedback || ''}">
        <div class="word-header">
          <span 
            class="difficulty-badge"
            style="background: {getDifficultyColor(currentWord.word.difficulty)}"
          >
            {getDifficultyLabel(currentWord.word.difficulty)}
          </span>
          <span class="category">{currentWord.word.category}</span>
        </div>

        <div class="word-content">
          <div class="question">
            <p class="question-text">请做出这个手势：</p>
            <h3 class="target-word">{currentWord.word.word}</h3>
            <p class="target-pinyin">{currentWord.word.pinyin}</p>
          </div>

          {#if showAnswer}
            <div class="answer fade-in">
              <div class="answer-divider"></div>
              <p class="answer-title">提示</p>
              <p class="answer-text">{currentWord.word.description}</p>
              {#if currentWord.word.tags.length > 0}
                <div class="answer-tags">
                  {#each currentWord.word.tags as tag}
                    <span class="tag">{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          {#if currentFeedback}
            <div class="feedback-indicator">
              {#if currentFeedback === 'correct'}
                <div class="correct-feedback">
                  <span class="feedback-icon">✅</span>
                  <span class="feedback-text">正确！做得好！</span>
                </div>
              {:else}
                <div class="incorrect-feedback">
                  <span class="feedback-icon">❌</span>
                  <span class="feedback-text">别灰心，下次加油！</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        {#if !currentFeedback}
          <div class="practice-actions">
            <button class="btn btn-outline" on:click={showHint}>
              💡 {showAnswer ? '隐藏提示' : '显示提示'}
            </button>
            <div class="answer-buttons">
              <button class="btn btn-secondary" on:click={() => markAnswer(false)}>
                ❌ 忘记了
              </button>
              <button class="btn btn-primary" on:click={() => markAnswer(true)}>
                ✅ 记住了
              </button>
            </div>
          </div>
        {/if}
      </div>

      {#if currentWord.progress}
        <div class="progress-info-card card">
          <h3 class="progress-info-title">学习进度</h3>
          <div class="progress-info-grid">
            <div class="progress-item">
              <span class="progress-item-value">🔥 {currentWord.progress.streak}</span>
              <span class="progress-item-label">连续天数</span>
            </div>
            <div class="progress-item">
              <span class="progress-item-value">✅ {currentWord.progress.correctCount}</span>
              <span class="progress-item-label">正确次数</span>
            </div>
            <div class="progress-item">
              <span class="progress-item-value">📊 {Math.round(
                currentWord.progress.correctCount / 
                Math.max(1, currentWord.progress.correctCount + currentWord.progress.incorrectCount) 
                * 100
              )}%</span>
              <span class="progress-item-label">正确率</span>
            </div>
            <div class="progress-item">
              <span class="progress-item-value">⏰ {currentWord.progress.interval}天</span>
              <span class="progress-item-label">下次复习</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .practice-page {
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
  
  .setup-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    max-width: 600px;
    margin: 0 auto;
  }
  
  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .filter-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
  
  .due-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .summary-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .due-count {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
  }
  
  .count {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--primary);
  }
  
  .label {
    font-size: var(--font-size-lg);
    color: var(--text-muted);
  }
  
  .summary-text {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .due-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
  }
  
  .due-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
  }
  
  .due-item .word {
    font-weight: 600;
  }
  
  .due-item .pinyin {
    font-size: var(--font-size-sm);
    color: var(--primary);
  }
  
  .due-item .streak {
    margin-left: auto;
    font-size: var(--font-size-sm);
    color: var(--warning);
  }
  
  .more {
    text-align: center;
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm);
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
  }
  
  .empty-icon {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
  }
  
  .empty-state p {
    margin: 0;
  }
  
  .empty-state .subtext {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-sm);
  }
  
  .action-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    justify-content: center;
  }
  
  .btn-lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
  }
  
  .complete-section {
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
    padding: var(--spacing-xl);
  }
  
  .complete-icon {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
  }
  
  .complete-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
  }
  
  .complete-text {
    color: var(--text-muted);
    margin-bottom: var(--spacing-lg);
  }
  
  .complete-stats {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--primary);
  }
  
  .stat-label {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .practice-section {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .progress-bar-container {
    background: var(--bg-card);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-lg);
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-bottom: var(--spacing-sm);
  }
  
  .progress-bar {
    height: 8px;
    background: var(--bg-hover);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
    transition: width 0.3s ease;
  }
  
  .practice-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    transition: var(--transition);
  }
  
  .practice-card.correct {
    border-color: var(--success);
    box-shadow: 0 0 0 2px var(--success);
  }
  
  .practice-card.incorrect {
    border-color: var(--error);
    box-shadow: 0 0 0 2px var(--error);
  }
  
  .word-header {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
  
  .difficulty-badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--bg-main);
  }
  
  .category {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .word-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .question {
    text-align: center;
  }
  
  .question-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-bottom: var(--spacing-md);
  }
  
  .target-word {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin: 0 0 var(--spacing-sm) 0;
  }
  
  .target-pinyin {
    font-size: var(--font-size-lg);
    color: var(--primary);
    margin: 0;
  }
  
  .answer-divider {
    height: 2px;
    background: var(--bg-hover);
    margin: var(--spacing-md) 0;
  }
  
  .answer-title {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-bottom: var(--spacing-sm);
  }
  
  .answer-text {
    font-size: var(--font-size-md);
    line-height: 1.6;
    margin: 0;
  }
  
  .answer-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-md);
  }
  
  .tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .feedback-indicator {
    text-align: center;
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
  }
  
  .correct-feedback {
    background: rgba(78, 205, 196, 0.2);
  }
  
  .incorrect-feedback {
    background: rgba(255, 71, 87, 0.2);
  }
  
  .feedback-icon {
    font-size: var(--font-size-xl);
    margin-right: var(--spacing-sm);
  }
  
  .feedback-text {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .practice-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .answer-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }
  
  .progress-info-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .progress-info-title {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0;
  }
  
  .progress-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .progress-item {
    text-align: center;
    padding: var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
  }
  
  .progress-item-value {
    display: block;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary);
  }
  
  .progress-item-label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: var(--spacing-xs);
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (min-width: 769px) {
    .practice-page {
      padding: var(--spacing-xl);
    }
  }
</style>
