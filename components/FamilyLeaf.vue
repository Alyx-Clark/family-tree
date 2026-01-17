<template>
  <div 
    class="family-leaf"
    :class="{ flipped: isFlipped }"
    :style="leafStyle"
    @click.stop="$emit('click')"
  >
    <div class="leaf-inner">
      <!-- Front Side -->
      <div class="leaf-front">
        <div class="leaf-photo">
          <img 
            v-if="member.photo_url" 
            :src="member.photo_url" 
            :alt="fullName" 
          />
          <div v-else class="photo-placeholder">
            {{ initials }}
          </div>
        </div>
        <div class="leaf-info">
          <h4 class="leaf-name">{{ fullName }}</h4>
          <p class="leaf-dates">{{ lifespan }}</p>
        </div>
        <div class="leaf-hint">Click to see more</div>
      </div>

      <!-- Back Side -->
      <div class="leaf-back">
        <div class="back-header">
          <h4 class="back-name">{{ fullName }}</h4>
          <button class="flip-back-btn" @click.stop="$emit('click')" title="Flip back">
            ↩
          </button>
        </div>
        
        <div class="back-content">
          <div v-if="member.bio" class="back-section">
            <span class="section-label">About</span>
            <p class="section-text">{{ member.bio }}</p>
          </div>

          <div v-if="member.hobbies?.length" class="back-section">
            <span class="section-label">Hobbies</span>
            <div class="tags">
              <span v-for="hobby in member.hobbies" :key="hobby" class="tag">{{ hobby }}</span>
            </div>
          </div>

          <div v-if="member.interests?.length" class="back-section">
            <span class="section-label">Interests</span>
            <div class="tags">
              <span v-for="interest in member.interests" :key="interest" class="tag">{{ interest }}</span>
            </div>
          </div>

          <div v-if="member.likes?.length" class="back-section">
            <span class="section-label">Likes</span>
            <div class="tags">
              <span v-for="like in member.likes" :key="like" class="tag tag-like">{{ like }}</span>
            </div>
          </div>

          <div v-if="!member.bio && !member.hobbies?.length && !member.interests?.length && !member.likes?.length" class="empty-details">
            <p>No additional details yet.</p>
          </div>
        </div>

        <div class="back-actions">
          <button class="action-btn edit" @click.stop="$emit('edit')" title="Edit">
            ✏️
          </button>
          <button class="action-btn delete" @click.stop="$emit('delete')" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FamilyMember, Position } from '~/types'

const props = defineProps<{
  member: FamilyMember
  position: Position
  isFlipped: boolean
}>()

defineEmits<{
  click: []
  edit: []
  delete: []
}>()

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
    : props.member.death_date === null ? 'Present' : '?'
  
  return `${birth} - ${death}`
})

const leafStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`
}))
</script>

<style scoped>
.family-leaf {
  position: absolute;
  width: 180px;
  height: 200px;
  perspective: 1000px;
  cursor: pointer;
  z-index: 10;
}

.family-leaf:hover {
  z-index: 20;
}

.leaf-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.family-leaf.flipped .leaf-inner {
  transform: rotateY(180deg);
}

.leaf-front,
.leaf-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

/* Front Side */
.leaf-front {
  background: linear-gradient(145deg, var(--color-cream), var(--color-parchment-light));
  border: 3px solid var(--color-leaf-green);
  box-shadow: 
    var(--shadow-lg),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  transition: all var(--transition-base);
}

.family-leaf:hover .leaf-front {
  border-color: var(--color-leaf-green-dark);
  box-shadow: 
    var(--shadow-xl),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateY(-4px);
}

.leaf-photo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 3px solid var(--color-parchment-border);
  background: linear-gradient(135deg, var(--color-leaf-green-light), var(--color-leaf-green));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.leaf-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  color: white;
  font-weight: 700;
  font-size: var(--text-xl);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.leaf-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-2) 0;
}

.leaf-name {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-bark-dark);
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
}

.leaf-dates {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  margin: var(--space-1) 0 0;
}

.leaf-hint {
  font-size: 10px;
  color: var(--color-ink-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.family-leaf:hover .leaf-hint {
  opacity: 1;
}

/* Back Side */
.leaf-back {
  background: linear-gradient(145deg, var(--color-parchment), var(--color-parchment-dark));
  border: 3px solid var(--color-bark);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
}

.back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-parchment-border);
  margin-bottom: var(--space-2);
}

.back-name {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-bark-dark);
  margin: 0;
}

.flip-back-btn {
  background: transparent;
  border: none;
  font-size: var(--text-base);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.flip-back-btn:hover {
  background: var(--color-parchment-light);
}

.back-content {
  flex: 1;
  overflow-y: auto;
  font-size: var(--text-xs);
}

.back-section {
  margin-bottom: var(--space-2);
}

.section-label {
  display: block;
  font-weight: 600;
  color: var(--color-bark);
  margin-bottom: var(--space-1);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-text {
  color: var(--color-ink-light);
  margin: 0;
  line-height: 1.4;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-parchment-light);
  border: 1px solid var(--color-parchment-border);
  border-radius: var(--radius-sm);
  font-size: 9px;
  color: var(--color-bark);
}

.tag-like {
  background: rgba(201, 162, 39, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold-dark);
}

.empty-details {
  text-align: center;
  color: var(--color-ink-muted);
  padding: var(--space-4) 0;
}

.back-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-parchment-border);
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-cream);
  border: 1px solid var(--color-parchment-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn.edit:hover {
  border-color: var(--color-accent);
  background: rgba(90, 124, 76, 0.1);
}

.action-btn.delete:hover {
  border-color: var(--color-danger);
  background: rgba(196, 75, 75, 0.1);
}
</style>
