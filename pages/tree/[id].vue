<template>
  <FamilyCanvas />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'canvas',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { initialize, tree } = useFamilyTree()

const treeId = computed(() => route.params.id as string)

// Load tree data when page mounts or tree ID changes
watch(treeId, async (newId) => {
  if (newId) {
    await initialize(newId)
    // Redirect to dashboard if tree not found
    if (!tree.value) {
      router.replace('/dashboard')
    }
  }
}, { immediate: true })
</script>
