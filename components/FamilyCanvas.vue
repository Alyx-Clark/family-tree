<template>
  <div 
    class="family-canvas"
    ref="canvasRef"
    @mousedown="startPan"
    @mousemove="pan"
    @mouseup="endPan"
    @mouseleave="endPan"
    @wheel="handleZoom"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Parchment Background -->
    <div class="canvas-background"></div>
    
    <!-- Transformable Container -->
    <div 
      class="canvas-content"
      :style="transformStyle"
    >
      <!-- SVG Layer for Branches -->
      <svg class="branches-layer">
        <defs>
          <linearGradient id="branchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #6b5344; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #4a3728; stop-opacity: 1" />
          </linearGradient>
          <linearGradient id="barkTexture" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color: #8b7355; stop-opacity: 0.5" />
            <stop offset="50%" style="stop-color: #5c4033; stop-opacity: 0.3" />
            <stop offset="100%" style="stop-color: #8b7355; stop-opacity: 0.5" />
          </linearGradient>
        </defs>
        <FamilyBranch
          v-for="branch in visibleBranches"
          :key="branch.id"
          :from-position="branch.fromPosition"
          :to-position="branch.toPosition"
          :relationship-type="branch.relationshipType"
        />
      </svg>
      
      <!-- Family Members Layer -->
      <div class="members-layer">
        <FamilyLeaf
          v-for="member in members"
          :key="member.id"
          :member="member"
          :position="memberPositions.get(member.id) || { x: 0, y: 0 }"
          :is-flipped="false"
          @click="openMemberDetail(member)"
          @edit="editMember(member)"
          @delete="confirmDeleteMember(member)"
        />
      </div>
    </div>

    <!-- Add Member Button -->
    <button class="add-member-btn" @click="showAddModal = true" title="Add Family Member">
      <span class="add-icon">+</span>
      <span class="add-text">Add Member</span>
    </button>

    <!-- Zoom Controls (Mobile) -->
    <div class="canvas-controls">
      <button class="control-btn" @click="zoomIn" title="Zoom In">+</button>
      <span class="zoom-display">{{ Math.round(scale * 100) }}%</span>
      <button class="control-btn" @click="zoomOut" title="Zoom Out">−</button>
      <button class="control-btn" @click="resetView" title="Reset View">⟲</button>
    </div>

    <!-- Empty State -->
    <div v-if="members.length === 0 && !isLoading" class="empty-state">
      <div class="empty-icon">🌱</div>
      <h3>Plant Your First Seed</h3>
      <p>Start building your family tree by adding your first family member.</p>
      <button class="btn btn-primary" @click="showAddModal = true">
        Add First Member
      </button>
    </div>

    <!-- Add Member Modal -->
    <AddMemberModal
      v-if="showAddModal"
      :existing-members="members"
      @close="showAddModal = false"
      @add="handleAddMember"
    />

    <!-- Edit Member Modal -->
    <AddMemberModal
      v-if="editingMember"
      :existing-members="members"
      :initial-data="editingMember"
      :is-editing="true"
      @close="editingMember = null"
      @update="handleUpdateMember"
    />

    <!-- Member Detail Modal -->
    <LeafDetailModal
      v-if="viewingMember"
      :member="viewingMember"
      @close="viewingMember = null"
      @edit="editMemberFromModal"
      @delete="confirmDeleteMemberFromModal"
    />

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="memberToDelete" class="modal-overlay" @click="memberToDelete = null">
        <div class="confirm-modal" @click.stop>
          <h3>Delete Family Member?</h3>
          <p>Are you sure you want to remove <strong>{{ memberToDelete.first_name }} {{ memberToDelete.last_name }}</strong> from your family tree? This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="memberToDelete = null">Cancel</button>
            <button class="btn btn-danger" @click="handleDeleteMember">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { FamilyMember, Position } from '~/types'

const { members, relationships, isLoading, initialize, addMember, updateMember, deleteMember, addRelationship, uploadMemberPhoto } = useFamilyTree()
const { calculateLayout, generateBranchPath, NODE_WIDTH, NODE_HEIGHT } = useTreeLayout()

// Canvas state
const canvasRef = ref<HTMLElement | null>(null)
const scale = useState('zoomLevel', () => 1)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanning = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

// UI State
const showAddModal = ref(false)
const editingMember = ref<FamilyMember | null>(null)
const memberToDelete = ref<FamilyMember | null>(null)
const viewingMember = ref<FamilyMember | null>(null)

// Computed positions from layout
const memberPositions = computed(() => {
  return calculateLayout(members.value, relationships.value)
})

// SVG viewBox for branches - removed as SVG now uses direct positioning

// Generate branch data for rendering
const visibleBranches = computed(() => {
  const branches: Array<{
    id: string
    fromPosition: Position
    toPosition: Position
    relationshipType: string
  }> = []

  const processed = new Set<string>()

  relationships.value.forEach(rel => {
    // Draw parent, spouse, and sibling relationships (avoid duplicates)
    if (!['parent', 'spouse', 'sibling'].includes(rel.relationship_type)) return
    
    const pairKey = [rel.member_id, rel.related_member_id].sort().join('-')
    if (processed.has(pairKey)) return
    processed.add(pairKey)

    const fromPos = memberPositions.value.get(rel.member_id)
    const toPos = memberPositions.value.get(rel.related_member_id)

    if (fromPos && toPos) {
      branches.push({
        id: rel.id,
        fromPosition: fromPos,
        toPosition: toPos,
        relationshipType: rel.relationship_type
      })
    }
  })

  return branches
})

// Transform style for pan/zoom
const transformStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center'
}))

// Pan handlers
const startPan = (e: MouseEvent) => {
  if (e.button !== 0) return // Only left click
  isPanning.value = true
  lastMousePos.value = { x: e.clientX, y: e.clientY }
}

const pan = (e: MouseEvent) => {
  if (!isPanning.value) return
  
  const dx = e.clientX - lastMousePos.value.x
  const dy = e.clientY - lastMousePos.value.y
  
  offsetX.value += dx
  offsetY.value += dy
  
  lastMousePos.value = { x: e.clientX, y: e.clientY }
}

const endPan = () => {
  isPanning.value = false
}

// Zoom handlers
const handleZoom = (e: WheelEvent) => {
  e.preventDefault()
  
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.25, Math.min(2, scale.value + delta))
  
  scale.value = newScale
}

const zoomIn = () => {
  scale.value = Math.min(2, scale.value + 0.1)
}

const zoomOut = () => {
  scale.value = Math.max(0.25, scale.value - 0.1)
}

const resetView = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

// Touch handlers for mobile
const touchStartPos = ref<{ x: number; y: number } | null>(null)

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    touchStartPos.value = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!touchStartPos.value || e.touches.length !== 1) return
  
  const dx = e.touches[0].clientX - touchStartPos.value.x
  const dy = e.touches[0].clientY - touchStartPos.value.y
  
  offsetX.value += dx
  offsetY.value += dy
  
  touchStartPos.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  }
}

const handleTouchEnd = () => {
  touchStartPos.value = null
}

// Member interactions
const openMemberDetail = (member: FamilyMember) => {
  viewingMember.value = member
}

const editMember = (member: FamilyMember) => {
  editingMember.value = member
}

const editMemberFromModal = () => {
  if (viewingMember.value) {
    editingMember.value = viewingMember.value
    viewingMember.value = null
  }
}

const confirmDeleteMember = (member: FamilyMember) => {
  memberToDelete.value = member
}

const confirmDeleteMemberFromModal = () => {
  if (viewingMember.value) {
    memberToDelete.value = viewingMember.value
    viewingMember.value = null
  }
}

const handleAddMember = async (data: { 
  member: Partial<FamilyMember>
  relationship?: { memberId: string; type: string }
  photoFile?: File
}) => {
  const result = await addMember(data.member)
  if (result.success && result.data) {
    // Upload photo if file provided
    if (data.photoFile) {
      await uploadMemberPhoto(result.data.id, data.photoFile)
    }
    
    // Add relationship if specified
    if (data.relationship) {
      // When user says new member "is child of" existing member:
      // - New member (result.data.id) is the CHILD
      // - Existing member (data.relationship.memberId) is the PARENT
      // So we need to swap the order based on relationship type
      
      if (data.relationship.type === 'child') {
        // New member is child of existing member
        // Store: new member -> (child of) -> existing member
        await addRelationship(
          result.data.id,           // New member (the child)
          data.relationship.memberId, // Existing member (the parent)
          'child' as any
        )
      } else if (data.relationship.type === 'parent') {
        // New member is parent of existing member  
        await addRelationship(
          result.data.id,           // New member (the parent)
          data.relationship.memberId, // Existing member (the child)
          'parent' as any
        )
      } else if (data.relationship.type === 'sibling') {
        // For siblings: add sibling relationship AND inherit parents
        await addRelationship(
          data.relationship.memberId,
          result.data.id,
          'sibling' as any
        )
        
        // Find the existing sibling's parents and add them as parents of the new member
        const existingSiblingId = data.relationship.memberId
        const siblingParentRelationships = relationships.value.filter(
          r => r.member_id === existingSiblingId && r.relationship_type === 'child'
        )
        
        // Add the same parents to the new sibling
        for (const rel of siblingParentRelationships) {
          const parentId = rel.related_member_id
          await addRelationship(
            result.data.id,  // New sibling is child
            parentId,        // of the same parent
            'child' as any
          )
        }
      } else {
        // For spouse, order doesn't matter
        await addRelationship(
          data.relationship.memberId,
          result.data.id,
          data.relationship.type as any
        )
      }
    }
  }
  showAddModal.value = false
}

const handleUpdateMember = async (data: { 
  id: string
  updates: Partial<FamilyMember>
  photoFile?: File 
}) => {
  // Upload photo if file provided
  if (data.photoFile) {
    await uploadMemberPhoto(data.id, data.photoFile)
  }
  
  await updateMember(data.id, data.updates)
  editingMember.value = null
}

const handleDeleteMember = async () => {
  if (!memberToDelete.value) return
  await deleteMember(memberToDelete.value.id)
  memberToDelete.value = null
}

// Initialize on mount
onMounted(async () => {
  await initialize()
  
  // Center the view if there are members
  if (members.value.length > 0) {
    // Small delay to ensure positions are calculated
    await nextTick()
  }
})
</script>

<style scoped>
.family-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}

.family-canvas:active {
  cursor: grabbing;
}

.canvas-background {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at center, transparent 0%, rgba(200, 180, 150, 0.1) 100%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(200, 180, 150, 0.05) 50px,
      rgba(200, 180, 150, 0.05) 51px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(200, 180, 150, 0.05) 50px,
      rgba(200, 180, 150, 0.05) 51px
    ),
    linear-gradient(to bottom, var(--color-parchment-light), var(--color-parchment));
  pointer-events: none;
}

.canvas-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transition: transform 0.05s ease-out;
}

.branches-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 4000px;
  height: 4000px;
  margin-left: -2000px;
  margin-top: -2000px;
  pointer-events: none;
  overflow: visible;
}

.members-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.add-member-btn {
  position: absolute;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
  z-index: 100;
}

.add-member-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.add-icon {
  font-size: var(--text-lg);
  font-weight: 700;
}

.canvas-controls {
  position: absolute;
  bottom: var(--space-6);
  left: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-cream);
  border: 2px solid var(--color-parchment-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.control-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  color: var(--color-bark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.control-btn:hover {
  background: var(--color-parchment);
  color: var(--color-accent);
}

.zoom-display {
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  min-width: 40px;
  text-align: center;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: var(--space-8);
  background: var(--color-cream);
  border: 2px dashed var(--color-parchment-border);
  border-radius: var(--radius-2xl);
  max-width: 400px;
  z-index: 50;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  margin-bottom: var(--space-2);
}

.empty-state p {
  color: var(--color-ink-muted);
  margin-bottom: var(--space-6);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.confirm-modal {
  background: var(--color-cream);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.confirm-modal h3 {
  margin-bottom: var(--space-3);
}

.confirm-modal p {
  color: var(--color-ink-light);
  margin-bottom: var(--space-6);
}

.confirm-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .add-text {
    display: none;
  }
  
  .add-member-btn {
    padding: var(--space-4);
    border-radius: var(--radius-full);
  }
  
  .add-icon {
    font-size: var(--text-xl);
  }
}
</style>
