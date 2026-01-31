<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-left">
        <span class="logo-icon">🌳</span>
        <h1 class="logo-text">Family Tree</h1>
      </div>
      <div class="header-right">
        <button class="theme-toggle" @click="toggleColorMode" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="theme-icon sun" :class="{ active: !isDark }">☀️</span>
          <span class="theme-icon moon" :class="{ active: isDark }">🌙</span>
        </button>
        <NuxtLink to="/profile" class="btn btn-ghost" title="Profile">
          <span>👤</span>
        </NuxtLink>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="dashboard-content">
        <div class="section-header">
          <h2>Your Family Trees</h2>
          <button class="btn btn-primary" @click="showCreateModal = true">
            <span class="btn-icon">+</span>
            New Tree
          </button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <span class="loading-spinner">🌿</span>
          <p>Loading your trees...</p>
        </div>

        <div v-else-if="treeItems.length === 0" class="empty-state">
          <div class="empty-icon">🌱</div>
          <h3>No Family Trees Yet</h3>
          <p>Create your first family tree to get started!</p>
          <button class="btn btn-primary" @click="showCreateModal = true">
            Create Your First Tree
          </button>
        </div>

        <div v-else class="tree-grid">
          <div 
            v-for="item in treeItems" 
            :key="item.id" 
            class="tree-card"
            @click="navigateToTree(item.id)"
          >
            <div class="tree-card-icon">🌳</div>
            <div class="tree-card-content">
              <h3 class="tree-card-title">{{ item.name }}</h3>
              <p class="tree-card-meta">
                <span class="member-count">{{ item.member_count }} member{{ item.member_count !== 1 ? 's' : '' }}</span>
                <span class="separator">•</span>
                <span class="updated">{{ formatDate(item.updated_at) }}</span>
              </p>
            </div>
            <button 
              class="tree-card-delete" 
              @click.stop="confirmDelete(item)"
              title="Delete tree"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Tree Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Create New Tree</h3>
          <button class="modal-close" @click="showCreateModal = false">×</button>
        </div>
        <form @submit.prevent="handleCreateTree">
          <div class="form-group">
            <label for="treeName">Tree Name</label>
            <input 
              id="treeName"
              v-model="newTreeName" 
              type="text" 
              placeholder="e.g., Smith Family Tree"
              required
              autofocus
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showCreateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isCreating">
              {{ isCreating ? 'Creating...' : 'Create Tree' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal modal-danger">
        <div class="modal-header">
          <h3>Delete Tree</h3>
          <button class="modal-close" @click="showDeleteModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ treeToDelete?.name }}</strong>?</p>
          <p class="warning-text">This will permanently delete all members and relationships in this tree.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="showDeleteModal = false">Cancel</button>
          <button type="button" class="btn btn-danger" @click="handleDeleteTree" :disabled="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete Tree' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TreeListItem } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const router = useRouter()
const { fetchTreesWithCounts, createTree, deleteTree, isLoading } = useFamilyTree()
const { isDark, toggleColorMode, initColorMode } = useColorMode()

const treeItems = ref<TreeListItem[]>([])
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const newTreeName = ref('')
const treeToDelete = ref<TreeListItem | null>(null)
const isCreating = ref(false)
const isDeleting = ref(false)

onMounted(async () => {
  initColorMode()
  treeItems.value = await fetchTreesWithCounts()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

const navigateToTree = (treeId: string) => {
  router.push(`/tree/${treeId}`)
}

const handleCreateTree = async () => {
  if (!newTreeName.value.trim()) return
  
  isCreating.value = true
  const result = await createTree(newTreeName.value.trim())
  isCreating.value = false
  
  if (result.success && result.data) {
    showCreateModal.value = false
    newTreeName.value = ''
    // Navigate to the new tree
    router.push(`/tree/${result.data.id}`)
  }
}

const confirmDelete = (item: TreeListItem) => {
  treeToDelete.value = item
  showDeleteModal.value = true
}

const handleDeleteTree = async () => {
  if (!treeToDelete.value) return
  
  isDeleting.value = true
  const result = await deleteTree(treeToDelete.value.id)
  isDeleting.value = false
  
  if (result.success) {
    treeItems.value = treeItems.value.filter(t => t.id !== treeToDelete.value?.id)
    showDeleteModal.value = false
    treeToDelete.value = null
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--color-parchment);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  background: var(--color-cream);
  border-bottom: 2px solid var(--color-parchment-border);
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  font-size: var(--text-2xl);
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-bark-dark);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.dashboard-main {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-content {
  background: var(--color-cream);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-parchment-border);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.section-header h2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-bark-dark);
  margin: 0;
}

.btn-icon {
  font-size: 1.2em;
  margin-right: var(--space-1);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  color: var(--color-ink-muted);
}

.loading-spinner {
  font-size: 3rem;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-bark-dark);
  margin: 0 0 var(--space-2);
}

.empty-state p {
  color: var(--color-ink-muted);
  margin: 0 0 var(--space-6);
}

/* Tree Grid */
.tree-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.tree-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-parchment);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tree-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-leaf);
}

.tree-card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.tree-card-content {
  flex: 1;
  min-width: 0;
}

.tree-card-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-bark-dark);
  margin: 0 0 var(--space-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-card-meta {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  margin: 0;
}

.tree-card-meta .separator {
  margin: 0 var(--space-1);
}

.tree-card-delete {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
}

.tree-card:hover .tree-card-delete {
  opacity: 0.6;
}

.tree-card-delete:hover {
  opacity: 1 !important;
  background: var(--color-error-bg);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--color-cream);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
  border: 2px solid var(--color-parchment-border);
}

.modal-danger .modal-header h3 {
  color: var(--color-error);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.modal-header h3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--color-bark-dark);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--color-ink-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--color-parchment);
  color: var(--color-ink);
}

.modal-body {
  margin-bottom: var(--space-4);
}

.modal-body p {
  margin: 0 0 var(--space-2);
  color: var(--color-ink);
}


.warning-text {
  color: var(--color-danger) !important;
  font-size: var(--text-sm);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: 500;
  color: var(--color-ink);
}

.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-parchment);
  color: var(--color-ink);
  transition: all var(--transition-fast);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-leaf);
  box-shadow: 0 0 0 3px var(--color-leaf-light);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
