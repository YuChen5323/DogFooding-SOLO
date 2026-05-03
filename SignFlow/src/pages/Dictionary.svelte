<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getDictionaryWords, 
    getCategories,
    type SignWord,
    getProgress,
    updateProgressAfterPractice
  } from '../lib/db/indexeddb'
  import { playSound, provideFeedback } from '../lib/stores/accessibility'
  
  let words: SignWord[] = []
  let filteredWords: SignWord[] = []
  let categories: string[] = []
  let loading = true
  let error: string | null = null
  
  let searchQuery = ''
  let selectedCategory = ''
  let selectedDifficulty = ''
  let selectedWord: SignWord | null = null
  
  let isPlaying = false
  
  onMount(async () => {
    try {
      [words, categories] = await Promise.all([
        getDictionaryWords(),
        getCategories()
      ])
      filteredWords = words
      loading = false
    } catch (e: any) {
      error = e?.message || '加载失败'
      loading = false
    }
  })
  
  $: {
    let filtered = words
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(w => 
        w.word.includes(searchQuery) ||
        w.pinyin.toLowerCase().includes(query) ||
        w.description.includes(searchQuery) ||
        w.tags.some(t => t.toLowerCase().includes(query))
      )
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(w => w.category === selectedCategory)
    }
    
    if (selectedDifficulty) {
      filtered = filtered.filter(w => w.difficulty === selectedDifficulty)
    }
    
    filteredWords = filtered
  }
  
  function selectWord(word: SignWord): void {
    selectedWord = word
    playSound('click')
  }
  
  function closeDetail(): void {
    selectedWord = null
    playSound('click')
  }
  
  async function markAsLearned(): Promise<void> {
    if (!selectedWord) return
    
    try {
      await updateProgressAfterPractice(selectedWord.id, true, 0.9, '手动标记为已掌握')
      provideFeedback('success')
    } catch (e) {
      console.error('Failed to update progress:', e)
      provideFeedback('error')
    }
  }
  
  function playDemo(): void {
    isPlaying = true
    
    setTimeout(() => {
      isPlaying = false
    }, 2000)
    
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
  
  function clearFilters(): void {
    searchQuery = ''
    selectedCategory = ''
    selectedDifficulty = ''
    playSound('click')
  }
</script>

<svelte:head>
  <title>手语词典 - SignFlow</title>
</svelte:head>

<div class="dictionary-page">
  <header class="page-header">
    <h1 class="page-title">手语词典</h1>
    <p class="page-subtitle">浏览和搜索手语词汇</p>
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
    <div class="search-section card">
      <div class="search-bar">
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="搜索词汇、拼音、描述..."
          aria-label="搜索手语词汇"
        />
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="filters">
        <div class="filter-group">
          <label for="category-filter">类别</label>
          <select 
            id="category-filter"
            bind:value={selectedCategory}
          >
            <option value="">全部类别</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="difficulty-filter">难度</label>
          <select 
            id="difficulty-filter"
            bind:value={selectedDifficulty}
          >
            <option value="">全部难度</option>
            <option value="beginner">初级</option>
            <option value="intermediate">中级</option>
            <option value="advanced">高级</option>
          </select>
        </div>
        
        <button 
          class="btn btn-outline btn-small"
          on:click={clearFilters}
        >
          清除筛选
        </button>
      </div>
      
      <div class="result-info">
        找到 {filteredWords.length} 个词汇
      </div>
    </div>

    {#if filteredWords.length > 0}
      <div class="words-grid">
        {#each filteredWords as word}
          <button
            class="word-card card"
            on:click={() => selectWord(word)}
          >
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
            <p class="word-description">{word.description}</p>
            
            <div class="word-tags">
              <span class="category-tag">{word.category}</span>
              {#each word.tags.slice(0, 2) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if word.tags.length > 2}
                <span class="tag-more">+{word.tags.length - 2}</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state card">
        <div class="empty-icon">🔍</div>
        <h3>未找到匹配的词汇</h3>
        <p>请尝试其他搜索关键词或调整筛选条件</p>
        <button class="btn btn-primary" on:click={clearFilters}>
          清除筛选
        </button>
      </div>
    {/if}
  {/if}

  {#if selectedWord}
    <div class="modal-backdrop" on:click={closeDetail} role="presentation">
      <div 
        class="modal" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        on:click|stopPropagation
      >
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">{selectedWord.word}</h2>
          <button 
            class="close-btn"
            on:click={closeDetail}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        
        <div class="modal-content">
          <div class="word-info-section">
            <div class="info-row">
              <span class="info-label">拼音</span>
              <span class="info-value">{selectedWord.pinyin}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">类别</span>
              <span class="info-value">{selectedWord.category}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">难度</span>
              <span 
                class="info-value difficulty-badge"
                style="background: {getDifficultyColor(selectedWord.difficulty)}; color: var(--bg-main);"
              >
                {getDifficultyLabel(selectedWord.difficulty)}
              </span>
            </div>
          </div>
          
          <div class="description-section">
            <h4 class="section-subtitle">手势描述</h4>
            <p class="description-text">{selectedWord.description}</p>
          </div>
          
          <div class="demo-section">
            <h4 class="section-subtitle">视频演示</h4>
            <div class="demo-container">
              <div class="demo-placeholder">
                <div class="placeholder-icon">🎬</div>
                <p>视频演示</p>
              </div>
              <button 
                class="btn btn-primary {isPlaying ? 'playing' : ''}"
                on:click={playDemo}
                disabled={isPlaying}
              >
                {isPlaying ? '⏸ 播放中...' : '▶ 播放演示'}
              </button>
            </div>
          </div>
          
          <div class="tags-section">
            <h4 class="section-subtitle">相关标签</h4>
            <div class="tags-list">
              {#each selectedWord.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn btn-outline"
            on:click={closeDetail}
          >
            关闭
          </button>
          <button 
            class="btn btn-primary"
            on:click={markAsLearned}
          >
            ✅ 标记为已掌握
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dictionary-page {
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
  
  .search-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }
  
  .search-bar {
    position: relative;
  }
  
  .search-bar input[type="search"] {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-xl) var(--spacing-md) var(--spacing-md);
    background: var(--bg-secondary);
    border: 2px solid var(--bg-hover);
    border-radius: var(--border-radius);
    color: var(--text-primary);
    font-size: var(--font-size-md);
    transition: var(--transition);
  }
  
  .search-bar input[type="search"]:focus {
    border-color: var(--primary);
    outline: none;
  }
  
  .search-icon {
    position: absolute;
    right: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: var(--font-size-lg);
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-end;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .filter-group label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .filter-group select {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    border: 2px solid var(--bg-hover);
    border-radius: var(--border-radius);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    min-width: 140px;
    transition: var(--transition);
  }
  
  .filter-group select:focus {
    border-color: var(--primary);
    outline: none;
  }
  
  .btn-small {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
  
  .result-info {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .words-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
  
  .word-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: left;
    cursor: pointer;
    transition: var(--transition);
  }
  
  .word-card:hover {
    transform: translateY(-4px);
  }
  
  .word-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .word-text {
    font-size: var(--font-size-xl);
    font-weight: 700;
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
  
  .word-description {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
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
  
  .tag-more {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .empty-icon {
    font-size: var(--font-size-3xl);
  }
  
  .empty-state h3 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .empty-state p {
    color: var(--text-muted);
    margin: 0;
  }
  
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    z-index: 2000;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal {
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255, 123, 60, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--bg-hover);
  }
  
  .modal-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    margin: 0;
  }
  
  .close-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-hover);
    border-radius: 50%;
    font-size: var(--font-size-lg);
    transition: var(--transition);
  }
  
  .close-btn:hover {
    background: var(--error);
    color: white;
  }
  
  .modal-content {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .word-info-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
  
  .info-row {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .info-label {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .info-value {
    font-size: var(--font-size-md);
    font-weight: 600;
  }
  
  .section-subtitle {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin: 0 0 var(--spacing-sm) 0;
  }
  
  .description-text {
    font-size: var(--font-size-md);
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }
  
  .demo-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .demo-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: center;
  }
  
  .demo-placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }
  
  .placeholder-icon {
    font-size: var(--font-size-3xl);
  }
  
  .demo-placeholder p {
    color: var(--text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  
  .playing {
    opacity: 0.7;
  }
  
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--bg-hover);
  }
  
  @media (min-width: 769px) {
    .dictionary-page {
      padding: var(--spacing-xl);
    }
  }
</style>
