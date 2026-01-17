<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p class="text-muted">Manage your account and personal information</p>
      </div>

      <div class="profile-grid">
        <!-- Avatar Section -->
        <section class="profile-section card">
          <h3 class="section-title">Profile Picture</h3>
          <div class="avatar-section">
            <div class="avatar-preview">
              <img 
                v-if="profile?.avatar_url" 
                :src="profile.avatar_url" 
                alt="Profile picture" 
              />
              <span v-else class="avatar-placeholder-large">{{ userInitials }}</span>
            </div>
            <div class="avatar-actions">
              <label class="btn btn-secondary">
                <span>Upload Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleAvatarUpload" 
                  class="sr-only"
                />
              </label>
              <p class="text-muted text-xs">JPG, PNG, or GIF. Max 2MB.</p>
            </div>
          </div>
        </section>

        <!-- Personal Info Section -->
        <section class="profile-section card">
          <h3 class="section-title">Personal Information</h3>
          <form @submit.prevent="handleProfileUpdate" class="profile-form">
            <div class="form-group">
              <label class="form-label" for="fullName">Full Name</label>
              <input
                id="fullName"
                v-model="profileForm.fullName"
                type="text"
                class="form-input"
                placeholder="Your full name"
              />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Email Section -->
        <section class="profile-section card">
          <h3 class="section-title">Email Address</h3>
          <form @submit.prevent="handleEmailUpdate" class="profile-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                v-model="emailForm.email"
                type="email"
                class="form-input"
                placeholder="your@email.com"
              />
              <span class="form-hint">Current: {{ user?.email }}</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Updating...' : 'Update Email' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Password Section -->
        <section class="profile-section card">
          <h3 class="section-title">Change Password</h3>
          <form @submit.prevent="handlePasswordUpdate" class="profile-form">
            <div class="form-group">
              <label class="form-label" for="newPassword">New Password</label>
              <input
                id="newPassword"
                v-model="passwordForm.newPassword"
                type="password"
                class="form-input"
                placeholder="••••••••"
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="form-input"
                placeholder="••••••••"
              />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- Messages -->
      <Transition name="fade">
        <div v-if="message" :class="['message', message.type]">
          {{ message.text }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { 
  user, 
  profile, 
  isLoading, 
  fetchProfile, 
  updateProfile, 
  updateEmail, 
  updatePassword, 
  uploadAvatar 
} = useAuth()

const message = ref<{ text: string; type: 'success' | 'error' } | null>(null)

// Forms
const profileForm = reactive({
  fullName: ''
})

const emailForm = reactive({
  email: ''
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// Initialize form values
onMounted(async () => {
  if (!profile.value) {
    await fetchProfile()
  }
  if (profile.value) {
    profileForm.fullName = profile.value.full_name || ''
  }
  if (user.value) {
    emailForm.email = user.value.email || ''
  }
})

// Watch for profile changes
watch(profile, (newProfile) => {
  if (newProfile) {
    profileForm.fullName = newProfile.full_name || ''
  }
})

const userInitials = computed(() => {
  if (profile.value?.full_name) {
    return profile.value.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.value?.email?.[0].toUpperCase() || 'U'
})

const showMessage = (text: string, type: 'success' | 'error') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    showMessage('File is too large. Max 2MB.', 'error')
    return
  }

  const result = await uploadAvatar(file)
  if (result.success) {
    showMessage('Profile picture updated!', 'success')
  } else {
    showMessage(result.error || 'Failed to upload', 'error')
  }
}

const handleProfileUpdate = async () => {
  const result = await updateProfile({ full_name: profileForm.fullName })
  if (result.success) {
    showMessage('Profile updated!', 'success')
  } else {
    showMessage(result.error || 'Failed to update', 'error')
  }
}

const handleEmailUpdate = async () => {
  if (!emailForm.email) {
    showMessage('Please enter an email', 'error')
    return
  }
  const result = await updateEmail(emailForm.email)
  if (result.success) {
    showMessage(result.message || 'Email update initiated', 'success')
  } else {
    showMessage(result.error || 'Failed to update email', 'error')
  }
}

const handlePasswordUpdate = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showMessage('Passwords do not match', 'error')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    showMessage('Password must be at least 6 characters', 'error')
    return
  }
  const result = await updatePassword(passwordForm.newPassword)
  if (result.success) {
    showMessage('Password updated!', 'success')
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    showMessage(result.error || 'Failed to update password', 'error')
  }
}
</script>

<style scoped>
.profile-page {
  padding: var(--space-8) 0;
}

.profile-header {
  margin-bottom: var(--space-8);
}

.profile-header h1 {
  margin-bottom: var(--space-2);
}

.profile-grid {
  display: grid;
  gap: var(--space-6);
  max-width: 600px;
}

.profile-section {
  padding: var(--space-6);
}

.section-title {
  font-size: var(--text-lg);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-parchment-border);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  color: white;
  font-weight: 700;
  font-size: var(--text-3xl);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-actions {
  padding-top: var(--space-2);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  margin-top: var(--space-1);
}

.message {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-toast);
}

.message.success {
  background: var(--color-success);
  color: white;
}

.message.error {
  background: var(--color-danger);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.text-xs {
  font-size: var(--text-xs);
}

@media (max-width: 640px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
}
</style>
