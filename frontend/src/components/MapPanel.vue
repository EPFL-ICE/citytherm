<script setup lang="ts">
import { computed } from 'vue'
import { useLayersStore } from '@/stores/layers'
import NeighborhoodBadges from '@/components/NeighborhoodBadges.vue'
import SharedMap from '@/components/SharedMap.vue'

const props = defineProps<{
  layerId: string
}>()

const layersStore = useLayersStore()

// Get basic layer info
const layerInfo = computed(() => {
  return layersStore.possibleLayers.find((layer) => layer.id === props.layerId)
})
</script>

<template>
  <div class="map-panel">
    <SharedMap :visible-layer-id="layerId" class="maplibre-container" />
    <NeighborhoodBadges />
  </div>
</template>

<style scoped>
.map-panel {
  position: relative;
  height: 100%;
}

.maplibre-container {
  position: absolute;
  inset: 0;
}

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f5f5f5;
  color: #666;
}
</style>
