<template>
  <div class="canvas-layout">
    <header class="canvas-header">
      <div class="header-left">
        <NuxtLink to="/dashboard" class="logo-link">
          <span class="logo-icon">🌳</span>
          <span class="logo-text">Family Tree</span>
        </NuxtLink>
      </div>
      <div class="header-center">
        <h1 class="tree-name">{{ treeName }}</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-ghost" @click="toggleZoom('out')" title="Zoom Out">
          <span>−</span>
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="btn btn-ghost" @click="toggleZoom('in')" title="Zoom In">
          <span>+</span>
        </button>
        <div class="header-divider"></div>
        <button class="theme-toggle" @click="toggleColorMode" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="theme-icon sun" :class="{ active: !isDark }">☀️</span>
          <span class="theme-icon moon" :class="{ active: isDark }">🌙</span>
        </button>
        <NuxtLink to="/profile" class="btn btn-ghost" title="Profile">
          <span>👤</span>
        </NuxtLink>
      </div>
    </header>
    <main class="canvas-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const treeName = useState('treeName', () => 'My Family Tree')
const zoomLevel = useState('zoomLevel', () => 1)
const { isDark, toggleColorMode, initColorMode } = useColorMode()

onMounted(() => {
  initColorMode()
})

const toggleZoom = (direction: 'in' | 'out') => {
  if (direction === 'in') {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.1)
  } else {
    zoomLevel.value = Math.max(0.25, zoomLevel.value - 0.1)
  }
}
</script>

<style scoped>
.canvas-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-parchment);
}

.canvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background: var(--color-cream);
  border-bottom: 2px solid var(--color-parchment-border);
  box-shadow: var(--shadow-sm);
  z-index: 100;
}

.header-left {
  flex: 1;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
}

.logo-icon {
  font-size: var(--text-xl);
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-bark-dark);
}

.header-center {
  flex: 2;
  text-align: center;
}

.tree-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-bark);
  margin: 0;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.zoom-level {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  min-width: 45px;
  text-align: center;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--color-parchment-border);
  margin: 0 var(--space-2);
}

.canvas-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-parchment);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.theme-toggle:hover {
  background: var(--color-parchment-dark);
  transform: scale(1.05);
}

.theme-icon {
  position: absolute;
  font-size: 1rem;
  transition: all var(--transition-base);
  opacity: 0;
  transform: scale(0.5) rotate(-180deg);
}

.theme-icon.active {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
</style>
