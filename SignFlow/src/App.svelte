<script lang="ts">
  import { Router, Link } from 'svelte-spa-router'
  import { wrap } from 'svelte-spa-router/wrap'
  import type { ComponentType } from 'svelte'
  
  import Home from './pages/Home.svelte'
  import Practice from './pages/Practice.svelte'
  import Teach from './pages/Teach.svelte'
  import Dictionary from './pages/Dictionary.svelte'
  import Recognize from './pages/Recognize.svelte'
  import Settings from './pages/Settings.svelte'
  import Navbar from './components/Navbar.svelte'
  import { accessibilityStore } from './lib/stores/accessibility'
  
  const routes = {
    '/': Home,
    '/practice': Practice,
    '/teach': Teach,
    '/dictionary': Dictionary,
    '/recognize': Recognize,
    '/settings': Settings,
  }
  
  export let url = ''
  
  $: accessibilityStore.subscribe((a11y) => {
    if (a11y.reducedMotion) {
      document.documentElement.style.setProperty('--transition', 'none')
    }
  })
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="app">
  <Navbar />
  <main class="main-content">
    <Router {routes} {url} />
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .main-content {
    flex: 1;
    padding-bottom: 80px;
  }
  
  :global(main) {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
