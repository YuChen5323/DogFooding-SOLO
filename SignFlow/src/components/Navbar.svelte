<script lang="ts">
  import { Link, location } from 'svelte-spa-router'
  import { playSound } from '../lib/stores/accessibility'
  
  interface NavItem {
    path: string
    label: string
    icon: string
  }
  
  const navItems: NavItem[] = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/recognize', label: '识别', icon: '👋' },
    { path: '/practice', label: '练习', icon: '📝' },
    { path: '/teach', label: '教学', icon: '🎓' },
    { path: '/dictionary', label: '词典', icon: '📖' },
    { path: '/settings', label: '设置', icon: '⚙️' }
  ]
  
  function handleClick(): void {
    playSound('click')
  }
</script>

<nav class="navbar" role="navigation" aria-label="主导航">
  <div class="nav-container">
    <Link href="/" class="logo" on:click={handleClick} aria-label="返回首页">
      <span class="logo-icon">✋</span>
      <span class="logo-text">SignFlow</span>
    </Link>
    
    <ul class="nav-list" role="menubar">
      {#each navItems as item}
        <li role="none">
          <Link 
            href={item.path}
            class="nav-link {($location.path() === item.path || (item.path !== '/' && $location.path().startsWith(item.path))) ? 'active' : ''}"
            role="menuitem"
            aria-current={($location.path() === item.path || (item.path !== '/' && $location.path().startsWith(item.path))) ? 'page' : undefined}
            on:click={handleClick}
          >
            <span class="nav-icon" aria-hidden="true">{item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </Link>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<style>
  .navbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, var(--bg-secondary), rgba(22, 33, 62, 0.95));
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 123, 60, 0.2);
    z-index: 1000;
    padding: var(--spacing-sm) 0;
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
  }
  
  .logo {
    display: none;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: 700;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
  }
  
  .logo-icon {
    font-size: var(--font-size-2xl);
  }
  
  .logo-text {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .nav-list {
    display: flex;
    justify-content: space-around;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--text-muted);
    text-decoration: none;
    border-radius: var(--border-radius);
    transition: var(--transition);
    min-width: 48px;
    min-height: 48px;
  }
  
  .nav-link:hover,
  .nav-link:focus-visible {
    color: var(--primary);
    background: rgba(255, 123, 60, 0.1);
  }
  
  .nav-link.active {
    color: var(--primary);
  }
  
  .nav-link.active .nav-icon {
    transform: scale(1.2);
  }
  
  .nav-icon {
    font-size: var(--font-size-xl);
    transition: var(--transition);
  }
  
  .nav-label {
    font-size: var(--font-size-xs);
    font-weight: 500;
  }
  
  @media (min-width: 769px) {
    .navbar {
      top: 0;
      bottom: auto;
      border-top: none;
      border-bottom: 1px solid rgba(255, 123, 60, 0.2);
      padding: var(--spacing-md) 0;
    }
    
    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
    }
    
    .nav-list {
      gap: var(--spacing-sm);
    }
    
    .nav-link {
      flex-direction: row;
      padding: var(--spacing-sm) var(--spacing-md);
    }
    
    .nav-icon {
      font-size: var(--font-size-lg);
    }
    
    .nav-label {
      font-size: var(--font-size-sm);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .nav-icon {
      transform: none !important;
    }
  }
</style>
