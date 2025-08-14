<script setup lang="ts">
import { computed } from 'vue'
import { useLayersStore } from '@/stores/layers'
import MapPanel from '@/components/MapPanel.vue'

const store = useLayersStore()

const cols = computed(() => {
  const n = store.selectedLayers.length
  if (n <= 1) return 1
  if (n <= 2) return 2
  return Math.min(3, n) // 3 cols only when >4 and 6-mode enabled
})
</script>

<template>
  <div :class="['map-grid', `cols-${cols}`]">
    <MapPanel v-for="lid in store.selectedLayers" :key="lid" :layer-id="lid" />
  </div>
</template>

<style scoped>
.map-grid {
  display: grid;
  gap: 0.75rem;
  grid-auto-rows: minmax(200px, 1fr);
}
.map-grid.cols-1 {
  grid-template-columns: 1fr;
}
.map-grid.cols-2 {
  grid-template-columns: 1fr 1fr;
}
.map-grid.cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
</style>
