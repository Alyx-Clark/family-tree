<template>
  <Teleport to="body">
    <div class="leaf-modal-overlay" @click="handleOverlayClick">
      <div 
        class="leaf-modal"
        :class="{ flipped: isFlipped }"
        @click.stop
      >
        <div class="leaf-modal-inner">
          <!-- Front Side -->
          <div class="modal-front">
            <button class="close-modal-btn" @click="$emit('close')" title="Close">×</button>
            
            <div class="modal-photo">
              <img 
                v-if="member.photo_url" 
                :src="member.photo_url" 
                :alt="fullName" 
              />
              <div v-else class="photo-placeholder">
                {{ initials }}
              </div>
            </div>
            
            <div class="modal-info">
              <h2 class="modal-name">{{ fullName }}</h2>
              <p class="modal-dates">{{ lifespan }}</p>
            </div>
            
            <button class="flip-btn" @click="isFlipped = true">
              <span class="flip-icon">↻</span>
              View Details
            </button>
          </div>

          <!-- Back Side -->
          <div class="modal-back">
            <button class="close-modal-btn" @click="$emit('close')" title="Close">×</button>
            
            <div class="back-header">
              <h2 class="modal-name">{{ fullName }}</h2>
              <button class="flip-back-btn" @click="isFlipped = false" title="Flip back">
                ↩ Back
              </button>
            </div>
            
            <div class="back-content">
              <div v-if="member.bio" class="detail-section">
                <h4 class="section-label">📖 About</h4>
                <p class="section-text">{{ member.bio }}</p>
              </div>

              <div v-if="member.hobbies?.length" class="detail-section">
                <h4 class="section-label">🎯 Hobbies</h4>
                <div class="tags">
                  <span v-for="hobby in member.hobbies" :key="hobby" class="tag">{{ hobby }}</span>
                </div>
              </div>

              <div v-if="member.interests?.length" class="detail-section">
                <h4 class="section-label">💡 Interests</h4>
                <div class="tags">
                  <span v-for="interest in member.interests" :key="interest" class="tag">{{ interest }}</span>
                </div>
              </div>

              <div v-if="member.likes?.length" class="detail-section">
                <h4 class="section-label">❤️ Likes</h4>
                <div class="tags">
                  <span v-for="like in member.likes" :key="like" class="tag tag-like">{{ like }}</span>
                </div>
              </div>

              <div v-if="!member.bio && !member.hobbies?.length && !member.interests?.length && !member.likes?.length" class="empty-details">
                <p>No additional details yet. Click edit to add more information.</p>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" @click="$emit('edit')">
                ✏️ Edit
              </button>
              <button class="btn btn-danger" @click="$emit('delete')">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { FamilyMember } from '~/types'

const props = defineProps<{
  member: FamilyMember
}>()

const emit = defineEmits<{
  close: []
  edit: []
  delete: []
}>()

const isFlipped = ref(false)

const fullName = computed(() => {
  const middle = props.member.middle_name ? ` ${props.member.middle_name}` : ''
  return `${props.member.first_name}${middle} ${props.member.last_name}`
})

const initials = computed(() => {
  return `${props.member.first_name[0]}${props.member.last_name[0]}`.toUpperCase()
})

const lifespan = computed(() => {
  const birth = props.member.birth_date 
    ? new Date(props.member.birth_date).getFullYear()
    : '?'
  const death = props.member.death_date
    ? new Date(props.member.death_date).getFullYear()
    : 'Present'
  return `${birth} - ${death}`
})

const handleOverlayClick = () => {
  emit('close')
}

// Close on Escape key
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      emit('close')
    }
  }
  document.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.leaf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.leaf-modal {
  width: 100%;
  max-width: 420px;
  height: auto;
  min-height: 480px;
  perspective: 1500px;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.8);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.leaf-modal-inner {
  position: relative;
  width: 100%;
  min-height: 480px;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.leaf-modal.flipped .leaf-modal-inner {
  transform: rotateY(180deg);
}

.modal-front,
.modal-back {
  position: absolute;
  width: 100%;
  min-height: 480px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: linear-gradient(135deg, var(--color-cream), var(--color-parchment-light));
  border: 3px solid var(--color-parchment-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
}

.modal-back {
  transform: rotateY(180deg);
}

.close-modal-btn {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-parchment);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-full);
  font-size: var(--text-2xl);
  line-height: 1;
  padding-bottom: 3px;
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 10;
}

.close-modal-btn:hover {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}

.modal-photo {
  width: 140px;
  height: 140px;
  margin: var(--space-4) auto;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 4px solid var(--color-parchment-border);
  box-shadow: var(--shadow-lg);
}

.modal-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-leaf), var(--color-leaf-dark));
  color: white;
  font-size: var(--text-4xl);
  font-weight: 700;
}

.modal-info {
  text-align: center;
  margin-bottom: var(--space-4);
}

.modal-name {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-bark);
  margin-bottom: var(--space-2);
}

.modal-dates {
  font-size: var(--text-md);
  color: var(--color-ink-muted);
}

.flip-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin: auto auto var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.flip-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.flip-icon {
  font-size: var(--text-lg);
}

/* Back side styles */
.back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-right: var(--space-10);
}

.flip-back-btn {
  padding: var(--space-2) var(--space-3);
  background: var(--color-parchment);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-bark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.flip-back-btn:hover {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.back-content {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--space-2);
}

.detail-section {
  margin-bottom: var(--space-4);
}

.section-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-leaf-dark);
  margin-bottom: var(--space-2);
}

.section-text {
  font-size: var(--text-md);
  color: var(--color-ink);
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  padding: var(--space-1) var(--space-3);
  background: var(--color-parchment);
  border: 1px solid var(--color-parchment-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-bark);
}

.tag-like {
  background: linear-gradient(135deg, #fff0f0, #ffe0e0);
  border-color: #ffccd5;
}

.empty-details {
  text-align: center;
  padding: var(--space-6);
  color: var(--color-ink-muted);
  font-style: italic;
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-parchment-border);
  margin-top: auto;
}

@media (max-width: 480px) {
  .leaf-modal {
    max-width: 100%;
  }
  
  .modal-front,
  .modal-back {
    padding: var(--space-4);
  }
}
</style>
