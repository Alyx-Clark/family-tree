<template>
  <div class="default-layout">
    <AppHeader />
    <main class="main-content">
      <slot />
    </main>
    <footer class="footer">
      <div class="container">
        <p class="footer-text">
          © {{ currentYear }} Family Tree. Preserving your heritage, one leaf at a time.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
const { initColorMode } = useColorMode()

onMounted(() => {
  initColorMode()
})
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--space-8) 0;
}

.footer {
  background: var(--color-bark-dark);
  color: var(--color-parchment-light);
  padding: var(--space-6) 0;
  margin-top: auto;
}

.footer-text {
  font-size: var(--text-sm);
  opacity: 0.8;
  text-align: center;
}
</style>
