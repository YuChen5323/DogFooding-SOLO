<script lang="ts">
  import { onMount } from 'svelte'
  import { Link } from 'svelte-spa-router'
  import { getStats, initDB, type SignWord, getDictionaryWords, getDueProgress } from '../lib/db/indexeddb'
  import { initSignClassifier } from '../lib/models/signClassifier'
  import { provideFeedback, playSound } from '../lib/stores/accessibility'
  
  interface Stats {
    totalWords: number
    learnedWords: number
    dueToday: number
    streakDays: number
    accuracy: number
  }
  
  let stats: Stats = {
    totalWords: 0,
    learnedWords: 0,
    dueToday: 0,
    streakDays: 0,
    accuracy: 0
  }
  
  let recentWords: SignWord[] = []
  let loading = true
  let error: string | null = null
  
  const quickActions = [
    { 
      path: '/recognize', 
      title: '手语识别', 
      description: '使用摄像头实时识别手语',
      icon: '👋',
      color: 'primary'
    },
    { 
      path: '/practice', 
      title: '开始练习', 
      description: '复习需要巩固的词汇',
      icon: '📝',
      color: 'success'
    },
    { 
      path: '/teach', 
      title: '教学模式', 
      description: '跟随标准手势学习',
      icon: '🎓',
      color: 'secondary'
    },
    { 
      path: '/dictionary', 
      title: '手语词典', 
      description: '浏览和搜索手语词汇',
      icon: '📖',
      color: 'accent'
    }
  ]
  
  onMount(async () => {
    try {
      await initDB()
      await initSignClassifier()
      
      stats = await getStats()
      recentWords = await getDictionaryWords({ limit: 6 })
      
      const dueProgress = await getDueProgress()
      stats.dueToday = dueProgress.length
      
      loading = false
    } catch (e: any) {
      error = e?.message || '加载失败'
      loading = false
      provideFeedback('error')
    }
  })
  
  function handleActionClick(): void {
    playSound('click')
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
</script>

<svelte:head>
  <title>SignFlow - 手语学习平台</title>
</svelte:head>

<div class="home-page">
  <header class="hero">
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-icon">✋</span>
        SignFlow
      </h1>
      <p class="hero-subtitle">手语识别与交互式学习平台</p>
    </div>
  </header>

  {#if loading}
    <div class="loading-container" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p>加载中...</p>
    </div>
  {:else if error}
    <div class="error-message" role="alert">
      <p>错误: {error}</p>
      <button class="btn btn-primary" on:click={() => window.location.reload()}>
        重新加载
      </button>
    </div>
  {:else}
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(255, 123, 60, 0.2);">
            📚
          </div>
          <div class="stat-info">
            <span class="stat-value">{stats.totalWords}</span>
            <span class="stat-label">总词汇</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(78, 205, 196, 0.2);">
            ✅
          </div>
          <div class="stat-info">
            <span class="stat-value">{stats.learnedWords}</span>
            <span class="stat-label">已掌握</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(255, 217, 61, 0.2);">
            ⏰
          </div>
          <div class="stat-info">
            <span class="stat-value">{stats.dueToday}</span>
            <span class="stat-label">待复习</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(255, 107, 107, 0.2);">
            🎯
          </div>
          <div class="stat-info">
            <span class="stat-value">{stats.accuracy}%</span>
            <span class="stat-label">准确率</span>
          </div>
        </div>
      </div>
    </section>

    <section class="quick-actions">
      <h2 class="section-title">快速开始</h2>
      <div class="actions-grid">
        {#each quickActions as action}
          <Link 
            href={action.path}
            class="action-card card"
            on:click={handleActionClick}
          >
            <div class="action-icon" style="color: var(--{action.color})">
              {action.icon}
            </div>
            <h3 class="action-title">{action.title}</h3>
            <p class="action-description">{action.description}</p>
          </Link>
        {/each}
      </div>
    </section>

    {#if recentWords.length > 0}
      <section class="recent-words">
        <div class="section-header">
          <h2 class="section-title">推荐词汇</h2>
          <Link href="/dictionary" class="view-all" on:click={handleActionClick}>
            查看全部 →
          </Link>
        </div>
        <div class="words-grid">
          {#each recentWords as word}
            <div class="word-card card">
              <div class="word-header">
                <h3 class="word-text">{word.word}</h3>
                <span 
                  class="difficulty-badge"
                  style="background: {getDifficultyColor(word.difficulty)}"
                >
                  {getDifficultyLabel(word.difficulty)}
                </span>
              </div>
              <p class="word-pinyin">{word.pinyin}</p>
              <p class="word-desc">{word.description}</p>
              <div class="word-tags">
                {#each word.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="features">
      <h2 class="section-title">平台特色</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎥</div>
          <h3>实时识别</h3>
          <p>基于MediaPipe Holistic的实时手部关键点提取，配合Xenova/transformers.js实现离线手语识别</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3>智能反馈</h3>
          <p>Canvas镜像叠加标准手势骨骼，实时关节角度纠错，让学习更高效</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>间隔重复</h3>
          <p>自适应间隔重复算法，根据学习进度优化复习时间，记忆更牢固</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">♿</div>
          <h3>无障碍友好</h3>
          <p>高对比度暖色主题、振动与声音提示，让所有用户都能轻松使用</p>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .home-page {
    padding-bottom: var(--spacing-xl);
  }
  
  .hero {
    padding: var(--spacing-xl) var(--spacing-lg);
    text-align: center;
    background: linear-gradient(135deg, rgba(255, 123, 60, 0.1) 0%, rgba(255, 179, 71, 0.1) 100%);
    border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  }
  
  .hero-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title-icon {
    font-size: var(--font-size-3xl);
  }
  
  .hero-subtitle {
    font-size: var(--font-size-lg);
    color: var(--text-muted);
  }
  
  .loading-container {
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
  
  .error-message {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--error);
  }
  
  .stats-section {
    padding: var(--spacing-lg);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-md);
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-card);
    border-radius: var(--border-radius);
    border: 1px solid rgba(255, 123, 60, 0.1);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    font-size: var(--font-size-xl);
  }
  
  .stat-info {
    display: flex;
    flex-direction: column;
  }
  
  .stat-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .section-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-bottom: var(--spacing-md);
  }
  
  .quick-actions {
    padding: 0 var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-md);
  }
  
  .action-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    transition: var(--transition);
    cursor: pointer;
  }
  
  .action-card:hover {
    transform: translateY(-4px);
  }
  
  .action-icon {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-sm);
  }
  
  .action-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .action-description {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0;
  }
  
  .recent-words {
    padding: 0 var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
  
  .view-all {
    font-size: var(--font-size-sm);
    color: var(--primary);
  }
  
  .words-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
  
  .word-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .word-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .word-text {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin: 0;
  }
  
  .difficulty-badge {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--bg-main);
  }
  
  .word-pinyin {
    font-size: var(--font-size-sm);
    color: var(--primary);
    margin: 0;
  }
  
  .word-desc {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .word-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }
  
  .tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--bg-hover);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .features {
    padding: 0 var(--spacing-lg);
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-md);
  }
  
  .feature-card {
    padding: var(--spacing-lg);
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    border: 1px solid rgba(255, 123, 60, 0.1);
  }
  
  .feature-icon {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-md);
  }
  
  .feature-card h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }
  
  .feature-card p {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    line-height: 1.6;
  }
  
  @media (min-width: 769px) {
    .hero {
      padding: var(--spacing-xl);
    }
    
    .stats-section {
      padding: var(--spacing-xl);
    }
    
    .quick-actions,
    .recent-words,
    .features {
      padding: 0 var(--spacing-xl);
    }
  }
</style>
