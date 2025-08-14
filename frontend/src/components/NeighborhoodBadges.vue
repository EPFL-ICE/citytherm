<script setup lang="ts">
import { computed } from 'vue'
import { useCompareStore } from '@/stores/compare'

const store = useCompareStore()

// In a real implementation, this would get the selected neighborhoods' centroids
// For now, we'll just show placeholder badges
const selectedNeighborhoods = computed(() => {
  return store.selectedNeighborhoodIds.map((uid, index) => ({
    uid,
    index: index + 1
  }))
})
</script>

<template>
  <div class="neighborhood-badges">
    <div
      v-for="neighborhood in selectedNeighborhoods"
      :key="neighborhood.uid"
      class="badge"
      :aria-label="`Selection index ${neighborhood.index} for ${neighborhood.uid}`"
    >
      {{ neighborhood.index }}
    </div>
  </div>
</template>

<style scoped>
.neighborhood-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  gap: 5px;
}

.badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
