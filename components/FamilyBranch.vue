<template>
  <g class="family-branch">
    <!-- Main branch path -->
    <path
      :d="pathData"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="['branch-path', `branch-${relationshipType}`]"
    />
    
    <!-- Bark texture overlay for tree-like appearance -->
    <path
      v-if="relationshipType !== 'spouse'"
      :d="pathData"
      stroke="url(#barkTexture)"
      :stroke-width="strokeWidth - 1"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.3"
    />
    
    <!-- Small twigs/nodes at connection points -->
    <circle
      v-if="relationshipType !== 'spouse'"
      :cx="startPoint.x"
      :cy="startPoint.y"
      r="5"
      :fill="strokeColor"
      class="branch-node"
    />
    <circle
      :cx="endPoint.x"
      :cy="endPoint.y"
      :r="relationshipType === 'spouse' ? 4 : 6"
      :fill="strokeColor"
      class="branch-node"
    />
    
    <!-- Decorative leaf at end for parent connections -->
    <g v-if="relationshipType === 'parent'" :transform="`translate(${endPoint.x - 6}, ${endPoint.y - 12})`">
      <path
        d="M 6 12 Q 0 6 6 0 Q 12 6 6 12"
        fill="#5a7c4c"
        opacity="0.6"
        class="decorative-leaf"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import type { Position } from '~/types'

const props = defineProps<{
  fromPosition: Position
  toPosition: Position
  relationshipType: string
}>()

const { NODE_WIDTH, NODE_HEIGHT } = useTreeLayout()

const strokeColor = computed(() => {
  switch (props.relationshipType) {
    case 'spouse':
      return '#c9a227' // Gold for spouse connections
    case 'sibling':
      return '#8b7355' // Lighter brown for siblings
    case 'parent':
    default:
      return '#5c4033' // Rich brown for parent-child
  }
})

const strokeWidth = computed(() => {
  switch (props.relationshipType) {
    case 'spouse':
      return 3
    case 'sibling':
      return 4
    default:
      return 5
  }
})

const startPoint = computed(() => {
  const x = props.fromPosition.x + NODE_WIDTH / 2
  const y = props.fromPosition.y + NODE_HEIGHT
  return { x, y }
})

const endPoint = computed(() => {
  if (props.relationshipType === 'spouse') {
    return {
      x: props.toPosition.x,
      y: props.toPosition.y + NODE_HEIGHT / 2
    }
  }
  if (props.relationshipType === 'sibling') {
    return {
      x: props.toPosition.x,
      y: props.toPosition.y + NODE_HEIGHT / 2
    }
  }
  return {
    x: props.toPosition.x + NODE_WIDTH / 2,
    y: props.toPosition.y
  }
})

const pathData = computed(() => {
  const fromX = props.fromPosition.x + NODE_WIDTH / 2
  const fromY = props.fromPosition.y + NODE_HEIGHT
  const toX = props.toPosition.x + NODE_WIDTH / 2
  const toY = props.toPosition.y

  if (props.relationshipType === 'spouse') {
    // Horizontal wavy connection for spouses
    const y = props.fromPosition.y + NODE_HEIGHT / 2
    const startX = props.fromPosition.x + NODE_WIDTH
    const endX = props.toPosition.x
    const midX = (startX + endX) / 2
    // Gentle curve for spouse connection
    return `M ${startX} ${y} Q ${midX} ${y - 10}, ${endX} ${y}`
  }

  if (props.relationshipType === 'sibling') {
    // Horizontal connection with arc for siblings
    const y = props.fromPosition.y + NODE_HEIGHT / 2
    const startX = props.fromPosition.x + NODE_WIDTH
    const endX = props.toPosition.x
    const midX = (startX + endX) / 2
    // Arc going up to show sibling connection
    return `M ${startX} ${y} Q ${midX} ${y - 30}, ${endX} ${y}`
  }

  // Organic curved branch for parent-child (tree-like)
  const midY = (fromY + toY) / 2
  // Add slight horizontal offset for more natural look
  const offsetX = (toX - fromX) * 0.1
  return `M ${fromX} ${fromY} 
          C ${fromX + offsetX} ${fromY + 30}, 
            ${toX - offsetX} ${toY - 30}, 
            ${toX} ${toY}`
})
</script>

<style scoped>
.family-branch {
  pointer-events: none;
}

.branch-path {
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
}

.branch-parent {
  stroke-linecap: round;
}

.branch-spouse {
  stroke-dasharray: 8, 4;
  opacity: 0.8;
}

.branch-sibling {
  stroke-dasharray: 12, 6;
  opacity: 0.7;
}

.branch-node {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  transition: r 0.2s ease;
}

.decorative-leaf {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  animation: leaf-sway 4s ease-in-out infinite;
  transform-origin: bottom center;
}

@keyframes leaf-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
</style>
