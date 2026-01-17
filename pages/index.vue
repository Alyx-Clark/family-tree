<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero parchment-bg">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title animate-fade-in-up">
            Discover Your Roots,<br />
            <span class="highlight">Grow Your Legacy</span>
          </h1>
          <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 100ms">
            Create beautiful, interactive family trees that bring your ancestry to life. 
            Connect generations, preserve memories, and share your heritage.
          </p>
          <div class="hero-actions animate-fade-in-up" style="animation-delay: 200ms">
            <NuxtLink to="/signup" class="btn btn-primary btn-lg">
              Start Your Tree
              <span class="btn-icon">→</span>
            </NuxtLink>
            <NuxtLink to="/login" class="btn btn-secondary btn-lg">
              Sign In
            </NuxtLink>
          </div>
        </div>
        <div class="hero-illustration animate-fade-in-up" style="animation-delay: 300ms">
          <div class="tree-visual">
            <div class="tree-trunk"></div>
            <div class="tree-branches">
              <div class="branch branch-1"></div>
              <div class="branch branch-2"></div>
              <div class="branch branch-3"></div>
            </div>
            <div class="leaves">
              <div class="leaf leaf-1">👨‍👩‍👧‍👦</div>
              <div class="leaf leaf-2">👴</div>
              <div class="leaf leaf-3">👵</div>
              <div class="leaf leaf-4">👨</div>
              <div class="leaf leaf-5">👩</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">Why Family Tree?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌿</div>
            <h3 class="feature-title">Infinite Canvas</h3>
            <p class="feature-description">
              Grow your tree without limits. Pan, zoom, and explore generations 
              with our intuitive infinite canvas.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📖</div>
            <h3 class="feature-title">Rich Profiles</h3>
            <p class="feature-description">
              Capture more than just names. Add photos, stories, hobbies, 
              and memories to each family member.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h3 class="feature-title">Smart Connections</h3>
            <p class="feature-description">
              Automatic layout and organization based on family relationships. 
              Parents, children, siblings — all connected beautifully.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">☁️</div>
            <h3 class="feature-title">Safe & Secure</h3>
            <p class="feature-description">
              Your family data is private and secure. Access your tree 
              from anywhere, anytime.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta parchment-bg">
      <div class="container text-center">
        <h2 class="cta-title">Ready to Plant Your Family Tree?</h2>
        <p class="cta-subtitle">
          Join thousands of families preserving their heritage for future generations.
        </p>
        <NuxtLink to="/signup" class="btn btn-primary btn-lg">
          Create Free Account
          <span class="btn-icon">→</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// Redirect to dashboard if already logged in
const user = useSupabaseUser()
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/dashboard')
  }
}, { immediate: true })
</script>

<style scoped>
.landing-page {
  overflow-x: hidden;
}

/* Hero Section */
.hero {
  padding: var(--space-16) 0;
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: center;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.1;
  margin-bottom: var(--space-6);
}

.hero-title .highlight {
  color: var(--color-accent);
  position: relative;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--color-ink-light);
  max-width: 500px;
  margin-bottom: var(--space-8);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.btn-icon {
  transition: transform var(--transition-fast);
}

.btn:hover .btn-icon {
  transform: translateX(4px);
}

/* Tree Visual */
.hero-illustration {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tree-visual {
  position: relative;
  width: 300px;
  height: 400px;
}

.tree-trunk {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 150px;
  background: linear-gradient(to right, var(--color-bark-dark), var(--color-bark), var(--color-bark-dark));
  border-radius: var(--radius-lg);
}

.tree-branches {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
}

.branch {
  position: absolute;
  height: 8px;
  background: var(--color-bark);
  border-radius: var(--radius-full);
}

.branch-1 {
  width: 80px;
  top: 50px;
  left: 10px;
  transform: rotate(-25deg);
}

.branch-2 {
  width: 100px;
  top: 80px;
  right: 10px;
  transform: rotate(20deg);
}

.branch-3 {
  width: 60px;
  top: 20px;
  left: 70px;
  transform: rotate(-10deg);
}

.leaves {
  position: absolute;
  inset: 0;
}

.leaf {
  position: absolute;
  width: 60px;
  height: 60px;
  background: var(--color-cream);
  border: 3px solid var(--color-leaf-green);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-2xl);
  box-shadow: var(--shadow-md);
  animation: float 3s ease-in-out infinite;
}

.leaf-1 { top: 0; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
.leaf-2 { top: 60px; left: 20px; animation-delay: 0.5s; }
.leaf-3 { top: 60px; right: 20px; animation-delay: 1s; }
.leaf-4 { top: 140px; left: 0; animation-delay: 1.5s; }
.leaf-5 { top: 140px; right: 0; animation-delay: 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.leaf-1 {
  animation: float1 3s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

/* Features Section */
.features {
  padding: var(--space-20) 0;
  background: var(--color-cream);
}

.section-title {
  text-align: center;
  margin-bottom: var(--space-12);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
}

.feature-card {
  background: var(--color-parchment-light);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-align: center;
  transition: all var(--transition-base);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-accent);
}

.feature-icon {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-4);
}

.feature-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-3);
}

.feature-description {
  color: var(--color-ink-light);
  line-height: 1.7;
}

/* CTA Section */
.cta {
  padding: var(--space-20) 0;
}

.cta-title {
  margin-bottom: var(--space-4);
}

.cta-subtitle {
  color: var(--color-ink-light);
  font-size: var(--text-lg);
  margin-bottom: var(--space-8);
}

/* Responsive */
@media (max-width: 768px) {
  .hero .container {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-subtitle {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-illustration {
    order: -1;
  }

  .tree-visual {
    width: 200px;
    height: 280px;
  }

  .leaf {
    width: 45px;
    height: 45px;
    font-size: var(--text-lg);
  }
}
</style>
