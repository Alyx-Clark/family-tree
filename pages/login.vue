<template>
  <div class="auth-card card">
    <div class="card-header">
      <h2 class="card-title">Welcome Back</h2>
      <p class="card-subtitle">Sign in to continue to your family tree</p>
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="form-group">
        <label class="form-label" for="email">Email Address</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="you@example.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          class="form-input"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
        <span v-if="isLoading">Signing in...</span>
        <span v-else>Sign In</span>
      </button>
    </form>

    <div class="auth-footer">
      <p>
        Don't have an account?
        <NuxtLink to="/signup" class="link">Create one</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { signIn, isLoading, error } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const handleSubmit = async () => {
  const result = await signIn(form.email, form.password)
  if (result.success) {
    await navigateTo('/dashboard')
  }
}
</script>

<style scoped>
.auth-card {
  max-width: 100%;
}

.card-subtitle {
  color: var(--color-ink-muted);
  margin-top: var(--space-2);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.auth-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-parchment-border);
  text-align: center;
  color: var(--color-ink-muted);
}

.link {
  color: var(--color-accent);
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
