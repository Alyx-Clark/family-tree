<template>
  <div class="auth-card card">
    <div class="card-header">
      <h2 class="card-title">Create Your Account</h2>
      <p class="card-subtitle">Start building your family tree today</p>
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div class="form-group">
        <label class="form-label" for="fullName">Full Name</label>
        <input
          id="fullName"
          v-model="form.fullName"
          type="text"
          class="form-input"
          placeholder="John Doe"
          required
          autocomplete="name"
        />
      </div>

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
          minlength="6"
          autocomplete="new-password"
        />
        <span class="form-hint">At least 6 characters</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          class="form-input"
          placeholder="••••••••"
          required
          autocomplete="new-password"
        />
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-if="successMessage" class="form-success">{{ successMessage }}</p>

      <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
        <span v-if="isLoading">Creating account...</span>
        <span v-else>Create Account</span>
      </button>
    </form>

    <div class="auth-footer">
      <p>
        Already have an account?
        <NuxtLink to="/login" class="link">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { signUp, isLoading, error } = useAuth()
const successMessage = ref('')

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  // Validate passwords match
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  successMessage.value = ''
  const result = await signUp(form.email, form.password, form.fullName)
  
  if (result.success) {
    successMessage.value = 'Account created! Please check your email to confirm your account.'
    // Clear form
    form.fullName = ''
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
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

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  margin-top: var(--space-1);
}

.form-success {
  font-size: var(--text-sm);
  color: var(--color-success);
  padding: var(--space-3);
  background: rgba(74, 140, 74, 0.1);
  border-radius: var(--radius-md);
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
