<script lang="ts">
  import { accessibilityStore, settingsStore, provideFeedback } from '../lib/stores/accessibility'
  import type { AppSettings } from '../lib/types'

  let settings: AppSettings

  const unsubscribe = settingsStore.subscribe((s) => {
    settings = s
  })

  function updateAccessibility<K extends keyof typeof settings.accessibility>(
    key: K,
    value: typeof settings.accessibility[K]
  ) {
    accessibilityStore.update((a11y) => ({
      ...a11y,
      [key]: value
    }))
    provideFeedback('success')
  }

  function updateRecognition<K extends keyof typeof settings.recognition>(
    key: K,
    value: typeof settings.recognition[K]
  ) {
    settingsStore.update((s) => ({
      ...s,
      recognition: {
        ...s.recognition,
        [key]: value
      }
    }))
  }

  function updatePractice<K extends keyof typeof settings.practice>(
    key: K,
    value: typeof settings.practice[K]
  ) {
    settingsStore.update((s) => ({
      ...s,
      practice: {
        ...s.practice,
        [key]: value
      }
    }))
  }

  function resetAllSettings() {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      localStorage.removeItem('signflow_settings')
      location.reload()
    }
  }

  $: a11y = settings?.accessibility
</script>

<svelte:head>
  <title>设置 - SignFlow</title>
</svelte:head>

<div class="settings-page">
  <header class="page-header">
    <h1>设置</h1>
    <p>自定义您的学习体验</p>
  </header>

  <section class="settings-section">
    <h2 class="section-title">
      <span class="icon">♿</span>
      无障碍设置
    </h2>

    <div class="settings-list">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">高对比度模式</span>
          <span class="setting-desc">增强文字与背景的对比度，提升可读性</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            checked={a11y?.highContrast || false}
            on:change={(e) => updateAccessibility('highContrast', e.target.checked)}
          />
          <span class="slider" />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">振动反馈</span>
          <span class="setting-desc">操作正确/错误时提供触觉反馈</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            checked={a11y?.vibration || false}
            on:change={(e) => updateAccessibility('vibration', e.target.checked)}
          />
          <span class="slider" />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">声音提示</span>
          <span class="setting-desc">播放音效提示操作结果</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            checked={a11y?.sound || false}
            on:change={(e) => updateAccessibility('sound', e.target.checked)}
          />
          <span class="slider" />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">大字体模式</span>
          <span class="setting-desc">增大界面文字尺寸</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            checked={a11y?.largeText || false}
            on:change={(e) => updateAccessibility('largeText', e.target.checked)}
          />
          <span class="slider" />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">减少动画</span>
          <span class="setting-desc">减少界面过渡动画效果</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            checked={a11y?.reducedMotion || false}
            on:change={(e) => updateAccessibility('reducedMotion', e.target.checked)}
          />
          <span class="slider" />
        </label>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">颜色方案</span>
          <span class="setting-desc">选择界面主题色调</span>
        </div>
        <div class="select-wrapper">
          <select
            value={a11y?.colorScheme || 'warm'}
            on:change={(e) => updateAccessibility('colorScheme', e.target.value)}
          >
            <option value="warm">暖色调</option>
            <option value="cool">冷色调</option>
            <option value="neutral">中性色</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">字体大小</span>
          <span class="setting-desc">精细调整文字大小</span>
        </div>
        <div class="select-wrapper">
          <select
            value={a11y?.fontSize || 'medium'}
            on:change={(e) => updateAccessibility('fontSize', e.target.value)}
          >
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>
      </div>
    </div>
  </section>

  <section class="settings-section">
    <h2 class="section-title">
      <span class="icon">🎯</span>
      识别设置
    </h2>

    <div class="settings-list">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">置信度阈值</span>
          <span class="setting-desc">仅显示置信度高于此值的识别结果</span>
        </div>
        <div class="slider-group">
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.05"
            value={settings?.recognition?.confidenceThreshold || 0.7}
            on:change={(e) => updateRecognition('confidenceThreshold', parseFloat(e.target.value))}
          />
          <span class="slider-value">{Math.round((settings?.recognition?.confidenceThreshold || 0.7) * 100)}%</span>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">帧缓冲大小</span>
          <span class="setting-desc">用于聚合识别的视频帧数</span>
        </div>
        <div class="slider-group">
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={settings?.recognition?.frameBufferSize || 30}
            on:change={(e) => updateRecognition('frameBufferSize', parseInt(e.target.value))}
          />
          <span class="slider-value">{settings?.recognition?.frameBufferSize || 30} 帧</span>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">推理间隔</span>
          <span class="setting-desc">模型推理的时间间隔（毫秒）</span>
        </div>
        <div class="slider-group">
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={settings?.recognition?.inferenceInterval || 100}
            on:change={(e) => updateRecognition('inferenceInterval', parseInt(e.target.value))}
          />
          <span class="slider-value">{settings?.recognition?.inferenceInterval || 100}ms</span>
        </div>
      </div>
    </div>
  </section>

  <section class="settings-section">
    <h2 class="section-title">
      <span class="icon">📚</span>
      练习设置
    </h2>

    <div class="settings-list">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">每日目标词汇</span>
          <span class="setting-desc">每天计划学习的新词汇数量</span>
        </div>
        <div class="select-wrapper">
          <select
            value={settings?.practice?.dailyGoal || 20}
            on:change={(e) => updatePractice('dailyGoal', parseInt(e.target.value))}
          >
            <option value="5">5 个</option>
            <option value="10">10 个</option>
            <option value="15">15 个</option>
            <option value="20">20 个</option>
            <option value="30">30 个</option>
          </select>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">每会话最大词汇</span>
          <span class="setting-desc">单次练习会话中的最大词汇数量</span>
        </div>
        <div class="select-wrapper">
          <select
            value={settings?.practice?.maxWordsPerSession || 10}
            on:change={(e) => updatePractice('maxWordsPerSession', parseInt(e.target.value))}
          >
            <option value="5">5 个</option>
            <option value="10">10 个</option>
            <option value="15">15 个</option>
            <option value="20">20 个</option>
          </select>
        </div>
      </div>
    </div>
  </section>

  <section class="settings-section danger-zone">
    <h2 class="section-title">
      <span class="icon">⚠️</span>
      危险区域
    </h2>

    <div class="danger-card">
      <p>重置所有设置为默认值，这将清除您的所有个性化配置。</p>
      <button class="btn btn-danger" on:click={resetAllSettings}>
        重置所有设置
      </button>
    </div>
  </section>
</div>

<style>
  .settings-page {
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-header h1 {
    font-size: 2rem;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }

  .page-header p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.25rem;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--border-color);
    color: var(--text-primary);
  }

  .icon {
    font-size: 1.5rem;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: var(--transition);
  }

  .setting-item:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(255, 123, 60, 0.1);
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .setting-label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 1rem;
  }

  .setting-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    cursor: pointer;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-secondary);
    border-radius: 28px;
    transition: var(--transition);
    border: 2px solid var(--border-color);
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: var(--text-secondary);
    border-radius: 50%;
    transition: var(--transition);
  }

  input:checked + .slider {
    background-color: var(--primary);
    border-color: var(--primary);
  }

  input:checked + .slider:before {
    transform: translateX(24px);
    background-color: white;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper select {
    padding: 10px 36px 10px 14px;
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.95rem;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition: var(--transition);
  }

  .select-wrapper select:hover {
    border-color: var(--primary);
  }

  .select-wrapper select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(255, 123, 60, 0.2);
  }

  .select-wrapper:after {
    content: '▼';
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    font-size: 0.7rem;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .slider-group {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px;
  }

  .slider-group input[type='range'] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    background: var(--bg-secondary);
    border-radius: 3px;
    outline: none;
  }

  .slider-group input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--primary);
    border-radius: 50%;
    cursor: pointer;
    transition: var(--transition);
  }

  .slider-group input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 0 0 4px rgba(255, 123, 60, 0.2);
  }

  .slider-value {
    min-width: 60px;
    text-align: right;
    font-weight: 600;
    color: var(--primary);
    font-size: 0.95rem;
  }

  .danger-zone {
    border-top: 2px solid var(--border-color);
    padding-top: 32px;
  }

  .danger-card {
    background: rgba(220, 53, 69, 0.05);
    border: 2px solid rgba(220, 53, 69, 0.3);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }

  .danger-card p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .btn-danger {
    background: transparent;
    border: 2px solid #dc3545;
    color: #dc3545;
    white-space: nowrap;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
  }

  .btn-danger:hover {
    background: #dc3545;
    color: white;
  }

  @media (max-width: 600px) {
    .settings-page {
      padding: 16px;
    }

    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .slider-group {
      width: 100%;
    }

    .danger-card {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
