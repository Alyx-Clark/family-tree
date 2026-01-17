<template>
  <div class="auth-layout parchment-bg">
    <div class="auth-container">
      <div class="auth-brand">
        <NuxtLink to="/" class="logo-link">
          <div class="logo-icon">🌳</div>
          <span class="logo-text">Family Tree</span>
        </NuxtLink>
      </div>
      <slot />
    </div>
    <div class="auth-decoration">
      <div class="tree-silhouette"></div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  position: relative;
  overflow: hidden;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  z-index: 1;
  animation: fadeInUp 0.5s ease forwards;
}

.auth-brand {
  text-align: center;
  margin-bottom: var(--space-8);
}

.logo-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
}

.logo-icon {
  font-size: var(--text-4xl);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-bark-dark);
}

.auth-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.tree-silhouette {
  position: absolute;
  bottom: -50px;
  right: -100px;
  width: 400px;
  height: 500px;
  background: linear-gradient(135deg, var(--color-bark-light) 0%, var(--color-bark) 100%);
  opacity: 0.05;
  border-radius: 50% 50% 0 0;
  transform: rotate(-15deg);
}

@media (max-width: 480px) {
  .auth-container {
    max-width: 100%;
  }
  
  .tree-silhouette {
    display: none;
  }
}
</style>
