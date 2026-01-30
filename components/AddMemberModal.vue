<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="add-member-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Family Member' : 'Add Family Member' }}</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Basic Info -->
          <div class="form-row form-row-3">
            <div class="form-group">
              <label class="form-label" for="firstName">First Name *</label>
              <input
                id="firstName"
                v-model="form.first_name"
                type="text"
                class="form-input"
                placeholder="John"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="middleName">Middle Name</label>
              <input
                id="middleName"
                v-model="form.middle_name"
                type="text"
                class="form-input"
                placeholder="William"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="lastName">Last Name *</label>
              <input
                id="lastName"
                v-model="form.last_name"
                type="text"
                class="form-input"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <!-- Dates -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="birthDate">Birth Date</label>
              <input
                id="birthDate"
                v-model="form.birth_date"
                type="date"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="deathDate">Death Date</label>
              <input
                id="deathDate"
                v-model="form.death_date"
                type="date"
                class="form-input"
              />
              <span class="form-hint">Leave empty if still living</span>
            </div>
          </div>

          <!-- Photo Section -->
          <div class="form-group">
            <label class="form-label">Photo</label>
            <div class="photo-tabs">
              <button
                type="button"
                class="photo-tab"
                :class="{ active: photoMode === 'upload' }"
                @click="photoMode = 'upload'"
              >
                📤 Upload
              </button>
              <button
                type="button"
                class="photo-tab"
                :class="{ active: photoMode === 'url' }"
                @click="photoMode = 'url'"
              >
                🔗 URL
              </button>
            </div>
            
            <!-- Upload Mode -->
            <div v-if="photoMode === 'upload'" class="photo-upload-area">
              <div v-if="photoPreview" class="photo-preview">
                <img :src="photoPreview" alt="Preview" />
                <button type="button" class="remove-photo-btn" @click="clearPhotoUpload">
                  ×
                </button>
              </div>
              <label v-else class="upload-dropzone" for="photoFile">
                <span class="upload-icon">📷</span>
                <span class="upload-text">Click to upload photo</span>
                <span class="upload-hint">JPG, PNG, or GIF (max 2MB)</span>
                <input
                  id="photoFile"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="handlePhotoUpload"
                />
              </label>
            </div>
            
            <!-- URL Mode -->
            <div v-else>
              <input
                id="photoUrl"
                v-model="form.photo_url"
                type="url"
                class="form-input"
                placeholder="https://example.com/photo.jpg"
              />
              <span class="form-hint">Direct link to an image</span>
            </div>
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label class="form-label" for="bio">Bio</label>
            <textarea
              id="bio"
              v-model="form.bio"
              class="form-input form-textarea"
              placeholder="A short biography..."
              rows="3"
            ></textarea>
          </div>

          <!-- Hobbies, Interests, Likes -->
          <div class="form-row form-row-3">
            <div class="form-group">
              <label class="form-label" for="hobbies">Hobbies</label>
              <input
                id="hobbies"
                v-model="hobbiesInput"
                type="text"
                class="form-input"
                placeholder="Reading, Hiking, ..."
              />
              <span class="form-hint">Comma separated</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="interests">Interests</label>
              <input
                id="interests"
                v-model="interestsInput"
                type="text"
                class="form-input"
                placeholder="History, Music, ..."
              />
              <span class="form-hint">Comma separated</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="likes">Likes</label>
              <input
                id="likes"
                v-model="likesInput"
                type="text"
                class="form-input"
                placeholder="Coffee, Dogs, ..."
              />
              <span class="form-hint">Comma separated</span>
            </div>
          </div>

          <!-- Relationship (only for new members) -->
          <div v-if="!isEditing && existingMembers.length > 0" class="form-section">
            <h4 class="section-heading">Relationship (Optional)</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="relatedTo">Related To</label>
                <select
                  id="relatedTo"
                  v-model="relationship.memberId"
                  class="form-input"
                >
                  <option value="">None</option>
                  <option 
                    v-for="member in sortedMembers" 
                    :key="member.id" 
                    :value="member.id"
                  >
                    {{ member.first_name }}{{ member.middle_name ? ` ${member.middle_name[0]}.` : '' }} {{ member.last_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="relationType">Relationship Type</label>
                <select
                  id="relationType"
                  v-model="relationship.type"
                  class="form-input"
                  :disabled="!relationship.memberId"
                >
                  <option value="child">Is child of</option>
                  <option value="parent">Is parent of</option>
                  <option value="spouse">Is spouse of</option>
                  <option value="sibling">Is sibling of</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ isEditing ? 'Save Changes' : 'Add Member' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { FamilyMember } from '~/types'

const props = defineProps<{
  existingMembers: FamilyMember[]
  initialData?: FamilyMember
  isEditing?: boolean
}>()

const emit = defineEmits<{
  close: []
  add: [data: { member: Partial<FamilyMember>; relationship?: { memberId: string; type: string }; photoFile?: File }]
  update: [data: { id: string; updates: Partial<FamilyMember>; photoFile?: File }]
}>()

// Photo upload state
const photoMode = ref<'upload' | 'url'>('upload')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(props.initialData?.photo_url || null)

// Handle photo file selection
const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert('File is too large. Maximum size is 2MB.')
    return
  }

  photoFile.value = file
  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  // Clear URL if uploading file
  form.photo_url = ''
}

// Clear uploaded photo
const clearPhotoUpload = () => {
  photoFile.value = null
  photoPreview.value = null
}

// Form data
const form = reactive({
  first_name: props.initialData?.first_name || '',
  middle_name: props.initialData?.middle_name || '',
  last_name: props.initialData?.last_name || '',
  birth_date: props.initialData?.birth_date || '',
  death_date: props.initialData?.death_date || '',
  photo_url: props.initialData?.photo_url || '',
  bio: props.initialData?.bio || ''
})

// Comma-separated inputs for arrays
const hobbiesInput = ref(props.initialData?.hobbies?.join(', ') || '')
const interestsInput = ref(props.initialData?.interests?.join(', ') || '')
const likesInput = ref(props.initialData?.likes?.join(', ') || '')

// Relationship for new members
const relationship = reactive({
  memberId: '',
  type: 'child'
})

// Sort existing members alphabetically by first name, then last name
const sortedMembers = computed(() => {
  return [...props.existingMembers].sort((a, b) => {
    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

// Parse comma-separated string to array
const parseList = (input: string): string[] => {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

const handleSubmit = () => {
  const memberData: Partial<FamilyMember> = {
    first_name: form.first_name,
    middle_name: form.middle_name || null,
    last_name: form.last_name,
    birth_date: form.birth_date || null,
    death_date: form.death_date || null,
    photo_url: form.photo_url || null,
    bio: form.bio || null,
    hobbies: parseList(hobbiesInput.value),
    interests: parseList(interestsInput.value),
    likes: parseList(likesInput.value)
  }

  if (props.isEditing && props.initialData) {
    emit('update', { 
      id: props.initialData.id, 
      updates: memberData,
      photoFile: photoFile.value || undefined
    })
  } else {
    const relationshipData = relationship.memberId 
      ? { memberId: relationship.memberId, type: relationship.type }
      : undefined
    emit('add', { 
      member: memberData, 
      relationship: relationshipData,
      photoFile: photoFile.value || undefined
    })
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  overflow-y: auto;
}

.add-member-modal {
  background: var(--color-cream);
  border-radius: var(--radius-xl);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: scaleIn 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-parchment-border);
  position: sticky;
  top: 0;
  background: var(--color-cream);
  z-index: 1;
}

.modal-header h2 {
  font-size: var(--text-xl);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: var(--text-2xl);
  color: var(--color-ink-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-parchment);
  color: var(--color-ink);
}

.modal-form {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-row-3 {
  grid-template-columns: repeat(3, 1fr);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  margin-top: var(--space-1);
}

.form-section {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-parchment-border);
}

.section-heading {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-bark);
  margin-bottom: var(--space-3);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-parchment-border);
}

/* Photo upload styles */
.photo-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.photo-tab {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: var(--color-parchment-light);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-bark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.photo-tab:hover {
  background: var(--color-parchment);
}

.photo-tab.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.photo-upload-area {
  margin-top: var(--space-2);
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  border: 2px dashed var(--color-parchment-border);
  border-radius: var(--radius-lg);
  background: var(--color-parchment-light);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-dropzone:hover {
  border-color: var(--color-accent);
  background: var(--color-parchment);
}

.upload-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-2);
}

.upload-text {
  font-weight: 500;
  color: var(--color-bark);
  margin-bottom: var(--space-1);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
}

.photo-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 3px solid var(--color-parchment-border);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-danger);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.remove-photo-btn:hover {
  background: var(--color-danger-light);
  transform: scale(1.1);
}

@media (max-width: 640px) {
  .form-row,
  .form-row-3 {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column-reverse;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}
</style>
