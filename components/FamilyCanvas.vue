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
      <svg class="branches-layer" :viewBox="svgViewBox" :style="svgStyle">
        <defs>
          <linearGradient id="branchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #6b5344; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #4a3728; stop-opacity: 1" />
          </linearGradient>
        </defs>
        <!-- Render all branches as paths -->
        <path
          v-for="branch in visibleBranches"
          :key="branch.id"
          :d="branch.pathData"
          :stroke="branch.strokeColor"
          :stroke-width="branch.relationshipType === 'spouse' ? 3 : 5"
          :stroke-dasharray="branch.relationshipType === 'spouse' ? '8,4' : 'none'"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="branch-path"
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

// SVG bounds that encompasses all member positions
const svgBounds = computed(() => {
  if (members.value.length === 0) {
    return { minX: -500, minY: -500, width: 1000, height: 1000 }
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  memberPositions.value.forEach(pos => {
    minX = Math.min(minX, pos.x - 100)
    minY = Math.min(minY, pos.y - 100)
    maxX = Math.max(maxX, pos.x + NODE_WIDTH + 100)
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT + 100)
  })
  
  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY
  }
})

// SVG viewBox string
const svgViewBox = computed(() => {
  const b = svgBounds.value
  return `${b.minX} ${b.minY} ${b.width} ${b.height}`
})

// SVG style for explicit positioning
const svgStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${svgBounds.value.minX}px`,
  top: `${svgBounds.value.minY}px`,
  width: `${svgBounds.value.width}px`,
  height: `${svgBounds.value.height}px`
}))

// Generate branch data for rendering with family group logic
const visibleBranches = computed(() => {
  const branches: Array<{
    id: string
    pathData: string
    relationshipType: string
    strokeColor: string
  }> = []

  const processed = new Set<string>()
  const processedFamilyGroups = new Set<string>()

  // First, identify and draw spouse connections
  relationships.value.forEach(rel => {
    if (rel.relationship_type !== 'spouse') return
    
    const pairKey = [rel.member_id, rel.related_member_id].sort().join('-')
    if (processed.has(pairKey)) return
    processed.add(pairKey)

    const fromPos = memberPositions.value.get(rel.member_id)
    const toPos = memberPositions.value.get(rel.related_member_id)

    if (fromPos && toPos) {
      // Draw horizontal spouse connector
      const y = fromPos.y + NODE_HEIGHT / 2
      const startX = Math.min(fromPos.x, toPos.x) + NODE_WIDTH
      const endX = Math.max(fromPos.x, toPos.x)
      const midX = (startX + endX) / 2
      
      branches.push({
        id: `spouse-${pairKey}`,
        pathData: `M ${startX} ${y} Q ${midX} ${y - 15}, ${endX} ${y}`,
        relationshipType: 'spouse',
        strokeColor: '#c9a227'
      })

      // Find shared children and draw family group branch
      const parent1Children = new Set<string>()
      const parent2Children = new Set<string>()
      
      relationships.value.forEach(r => {
        if (r.member_id === rel.member_id && r.relationship_type === 'parent') {
          parent1Children.add(r.related_member_id)
        }
        if (r.member_id === rel.related_member_id && r.relationship_type === 'parent') {
          parent2Children.add(r.related_member_id)
        }
      })

      // Find children that belong to both parents
      const sharedChildren = Array.from(parent1Children).filter(c => parent2Children.has(c))
      
      if (sharedChildren.length > 0) {
        const familyKey = [...sharedChildren].sort().join('-')
        if (!processedFamilyGroups.has(familyKey)) {
          processedFamilyGroups.add(familyKey)
          
          // Calculate positions
          const spouseMidX = (fromPos.x + toPos.x + NODE_WIDTH) / 2
          const spouseY = fromPos.y + NODE_HEIGHT / 2
          const dropY = fromPos.y + NODE_HEIGHT + 40 // Vertical drop point
          
          // Get child positions
          const childPositions = sharedChildren
            .map(childId => memberPositions.value.get(childId))
            .filter(pos => pos) as Position[]
          
          if (childPositions.length > 0) {
            const childMinX = Math.min(...childPositions.map(p => p.x + NODE_WIDTH / 2))
            const childMaxX = Math.max(...childPositions.map(p => p.x + NODE_WIDTH / 2))
            const horizontalY = dropY + 30
            
            // Draw vertical line from spouse connector down
            branches.push({
              id: `family-drop-${familyKey}`,
              pathData: `M ${spouseMidX} ${spouseY - 7} L ${spouseMidX} ${horizontalY}`,
              relationshipType: 'family-drop',
              strokeColor: '#5c4033'
            })
            
            // Draw horizontal bar connecting to all children
            if (childPositions.length > 1) {
              branches.push({
                id: `family-bar-${familyKey}`,
                pathData: `M ${childMinX} ${horizontalY} L ${childMaxX} ${horizontalY}`,
                relationshipType: 'family-bar',
                strokeColor: '#5c4033'
              })
            }
            
            // Draw vertical lines down to each child
            childPositions.forEach((childPos, i) => {
              const childCenterX = childPos.x + NODE_WIDTH / 2
              branches.push({
                id: `family-child-${familyKey}-${i}`,
                pathData: `M ${childCenterX} ${horizontalY} L ${childCenterX} ${childPos.y}`,
                relationshipType: 'family-child',
                strokeColor: '#5c4033'
              })
            })
            
            // Mark these parent-child relationships as processed
            sharedChildren.forEach(childId => {
              processed.add([rel.member_id, childId].sort().join('-'))
              processed.add([rel.related_member_id, childId].sort().join('-'))
            })
          }
        }
      }
    }
  })

  // Draw remaining parent-child relationships (single parents or unprocessed)
  // Group single parents with their children for family-group style
  const singleParentChildren = new Map<string, string[]>()
  
  relationships.value.forEach(rel => {
    if (rel.relationship_type !== 'parent') return
    
    const pairKey = [rel.member_id, rel.related_member_id].sort().join('-')
    if (processed.has(pairKey)) return
    
    // Group children by parent
    if (!singleParentChildren.has(rel.member_id)) {
      singleParentChildren.set(rel.member_id, [])
    }
    singleParentChildren.get(rel.member_id)!.push(rel.related_member_id)
  })
  
  // Draw family-group style for single parents
  singleParentChildren.forEach((children, parentId) => {
    const parentPos = memberPositions.value.get(parentId)
    if (!parentPos) return
    
    // Mark all as processed
    children.forEach(childId => {
      processed.add([parentId, childId].sort().join('-'))
    })
    
    const childPositions = children
      .map(childId => memberPositions.value.get(childId))
      .filter(pos => pos) as Position[]
    
    if (childPositions.length === 0) return
    
    // Calculate positions
    const parentCenterX = parentPos.x + NODE_WIDTH / 2
    const dropY = parentPos.y + NODE_HEIGHT + 40
    const horizontalY = dropY + 30
    
    const childMinX = Math.min(...childPositions.map(p => p.x + NODE_WIDTH / 2))
    const childMaxX = Math.max(...childPositions.map(p => p.x + NODE_WIDTH / 2))
    
    // Draw vertical line from parent down
    branches.push({
      id: `single-parent-drop-${parentId}`,
      pathData: `M ${parentCenterX} ${parentPos.y + NODE_HEIGHT} L ${parentCenterX} ${horizontalY}`,
      relationshipType: 'family-drop',
      strokeColor: '#5c4033'
    })
    
    // Draw horizontal bar connecting to all children (if more than one)
    if (childPositions.length > 1) {
      branches.push({
        id: `single-parent-bar-${parentId}`,
        pathData: `M ${childMinX} ${horizontalY} L ${childMaxX} ${horizontalY}`,
        relationshipType: 'family-bar',
        strokeColor: '#5c4033'
      })
    }
    
    // Draw vertical lines down to each child
    childPositions.forEach((childPos, i) => {
      const childCenterX = childPos.x + NODE_WIDTH / 2
      branches.push({
        id: `single-parent-child-${parentId}-${i}`,
        pathData: `M ${childCenterX} ${horizontalY} L ${childCenterX} ${childPos.y}`,
        relationshipType: 'family-child',
        strokeColor: '#5c4033'
      })
    })
  })

  // Sibling relationships are not drawn - they can be inferred from shared parent connections

  console.log('Visible branches:', branches.length)

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

// Zoom and pan handlers for trackpad gestures
const handleZoom = (e: WheelEvent) => {
  e.preventDefault()
  
  // Determine if this is a zoom gesture:
  // - Pinch-to-zoom: ctrlKey is true
  // - Mouse wheel: only vertical movement (deltaX === 0)
  const isPinchZoom = e.ctrlKey
  const isMouseWheel = !e.ctrlKey && e.deltaX === 0 && e.deltaY !== 0
  
  if (isPinchZoom || isMouseWheel) {
    // Zoom sensitivity (mouse wheel is less sensitive than pinch)
    const zoomSensitivity = isPinchZoom ? 0.005 : 0.001
    const delta = -e.deltaY * zoomSensitivity
    const newScale = Math.max(0.25, Math.min(2, scale.value + delta))
    
    // Zoom towards cursor position
    if (canvasRef.value) {
      const rect = canvasRef.value.getBoundingClientRect()
      // Cursor position relative to canvas center
      const cursorX = e.clientX - rect.left - rect.width / 2
      const cursorY = e.clientY - rect.top - rect.height / 2
      
      // Calculate how much the point under cursor would move due to scale change
      const scaleRatio = newScale / scale.value
      
      // Adjust offset to keep cursor position fixed
      offsetX.value = cursorX - (cursorX - offsetX.value) * scaleRatio
      offsetY.value = cursorY - (cursorY - offsetY.value) * scaleRatio
    }
    
    scale.value = newScale
  } else {
    // Two-finger scroll on trackpad: pan in all directions
    offsetX.value -= e.deltaX
    offsetY.value -= e.deltaY
  }
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
        
        // Also make the new child a child of the parent's spouse
        const parentId = data.relationship.memberId
        const parentSpouseRelationships = relationships.value.filter(
          r => r.member_id === parentId && r.relationship_type === 'spouse'
        )
        
        for (const rel of parentSpouseRelationships) {
          const spouseId = rel.related_member_id
          // Check if relationship already exists
          const alreadyChild = relationships.value.some(
            r => r.member_id === result.data.id && r.related_member_id === spouseId && r.relationship_type === 'child'
          )
          if (!alreadyChild) {
            await addRelationship(
              result.data.id,  // New child
              spouseId,        // Spouse of the parent
              'child' as any
            )
          }
        }
        } else if (data.relationship.type === 'parent') {
          // New member is parent of existing member  
          await addRelationship(
            result.data.id,           // New member (the parent)
            data.relationship.memberId, // Existing member (the child)
            'parent' as any
          )
          
          // Infer sibling relationships: new parent should also be parent of child's siblings
          const existingChildId = data.relationship.memberId
          const siblingsOfChild = relationships.value.filter(
            r => r.member_id === existingChildId && r.relationship_type === 'sibling'
          )
          
          for (const siblingRel of siblingsOfChild) {
            const siblingId = siblingRel.related_member_id
            // Check if parent relationship already exists
            const alreadyParent = relationships.value.some(
              r => r.member_id === result.data.id && r.related_member_id === siblingId && r.relationship_type === 'parent'
            )
            if (!alreadyParent) {
              await addRelationship(
                result.data.id,  // New parent
                siblingId,       // Sibling of the child
                'parent' as any
              )
            }
          }
          
          // Infer spouse relationships: if the child already has other parents, 
          // the new parent should be a spouse of those existing parents
          const existingParentRelationships = relationships.value.filter(
            r => r.member_id === existingChildId && r.relationship_type === 'child'
          )
          
          // Create spouse relationships with existing parents
          for (const rel of existingParentRelationships) {
            const existingParentId = rel.related_member_id
            // Don't create spouse relationship with self
            if (existingParentId !== result.data.id) {
              // Check if spouse relationship already exists
              const spouseExists = relationships.value.some(
                r => (r.member_id === result.data.id && r.related_member_id === existingParentId && r.relationship_type === 'spouse') ||
                     (r.member_id === existingParentId && r.related_member_id === result.data.id && r.relationship_type === 'spouse')
              )
              if (!spouseExists) {
                await addRelationship(
                  result.data.id,
                  existingParentId,
                  'spouse' as any
                )
              }
            }
          }
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
      } else if (data.relationship.type === 'spouse') {
        // Add spouse relationship
        await addRelationship(
          data.relationship.memberId,
          result.data.id,
          'spouse' as any
        )
        
        // Inherit children: new spouse becomes parent of partner's children
        const partnerId = data.relationship.memberId
        const partnerChildRelationships = relationships.value.filter(
          r => r.member_id === partnerId && r.relationship_type === 'parent'
        )
        
        // Make the new spouse a parent of each child
        for (const rel of partnerChildRelationships) {
          const childId = rel.related_member_id
          // Check if parent relationship already exists
          const parentExists = relationships.value.some(
            r => r.member_id === result.data.id && r.related_member_id === childId && r.relationship_type === 'parent'
          )
          if (!parentExists) {
            await addRelationship(
              result.data.id,  // New spouse becomes parent
              childId,         // of the partner's child
              'parent' as any
            )
          }
        }
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
  pointer-events: none;
  overflow: visible;
}

.members-layer {
  position: relative;
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
