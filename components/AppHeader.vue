<template>
  <header class="app-header">
    <div class="container header-content">
      <NuxtLink to="/" class="logo">
        <span class="logo-icon">🌳</span>
        <span class="logo-text">Family Tree</span>
      </NuxtLink>

      <nav class="nav-links" v-if="!user">
        <NuxtLink to="/login" class="nav-link">Login</NuxtLink>
        <NuxtLink to="/signup" class="btn btn-primary">Get Started</NuxtLink>
      </nav>

      <nav class="nav-links" v-else>
        <NuxtLink to="/dashboard" class="nav-link">My Tree</NuxtLink>
        <div class="user-menu" ref="menuRef">
          <button class="user-button" @click="toggleMenu">
            <div class="user-avatar">
              <img 
                v-if="profile?.avatar_url" 
                :src="profile.avatar_url" 
                :alt="profile?.full_name || 'User'" 
              />
              <span v-else class="avatar-placeholder">{{ userInitials }}</span>
            </div>
            <span class="user-name">{{ profile?.full_name || user.email }}</span>
            <span class="dropdown-arrow" :class="{ open: isMenuOpen }">▼</span>
          </button>
          <Transition name="dropdown">
            <div v-if="isMenuOpen" class="dropdown-menu">
              <NuxtLink to="/profile" class="dropdown-item" @click="closeMenu">
                <span>👤</span> Profile
              </NuxtLink>
              <NuxtLink to="/dashboard" class="dropdown-item" @click="closeMenu">
                <span>🌳</span> My Tree
              </NuxtLink>
              <hr class="dropdown-divider" />
              <button class="dropdown-item danger" @click="handleSignOut">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </Transition>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, profile, signOut, fetchProfile } = useAuth()

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

// Fetch profile on mount if user exists
onMounted(async () => {
  if (user.value && !profile.value) {
    await fetchProfile()
  }
})

// Watch for user changes
watch(user, async (newUser) => {
  if (newUser && !profile.value) {
    await fetchProfile()
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

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleSignOut = async () => {
  closeMenu()
  await signOut()
}

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      closeMenu()
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.app-header {
  background: var(--color-cream);
  border-bottom: 2px solid var(--color-parchment-border);
  position: sticky;
  top: 0;
  z-index: var(--z-dropdown);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
}

.logo-icon {
  font-size: var(--text-2xl);
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-bark-dark);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.nav-link {
  color: var(--color-bark);
  font-weight: 500;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-accent);
  background: var(--color-parchment);
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-button:hover {
  background: var(--color-parchment);
  border-color: var(--color-parchment-border);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-weight: 600;
  font-size: var(--text-sm);
}

.user-name {
  font-weight: 500;
  color: var(--color-bark);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  transition: transform var(--transition-fast);
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 180px;
  background: var(--color-cream);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-2);
  z-index: var(--z-dropdown);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  color: var(--color-bark);
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.dropdown-item:hover {
  background: var(--color-parchment);
  color: var(--color-accent);
}

.dropdown-item.danger {
  color: var(--color-danger);
}

.dropdown-item.danger:hover {
  background: rgba(196, 75, 75, 0.1);
}

.dropdown-divider {
  border: none;
  border-top: 1px solid var(--color-parchment-border);
  margin: var(--space-2) 0;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .user-name {
    display: none;
  }
  
  .dropdown-arrow {
    display: none;
  }
}
</style>
