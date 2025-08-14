<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useLayersStore } from '@/stores/layers'
import { useCompareStore } from '@/stores/compare'
import NeighborhoodBadges from '@/components/NeighborhoodBadges.vue'
import SharedMap from '@/components/SharedMap.vue'

const props = defineProps<{
  layerId: string
}>()

const layersStore = useLayersStore()
const compareStore = useCompareStore()
const mapComponent = ref<InstanceType<typeof SharedMap> | null>(null)

// Get basic layer info
const layerInfo = computed(() => {
  return layersStore.possibleLayers.find((layer) => layer.id === props.layerId)
})

onMounted(() => {
  // Set up a watcher to get the map instance when it's available
  const unwatch = watch(
    () => mapComponent.value,
    (newMapComponent) => {
      if (newMapComponent) {
        // Set up a watcher for selected features
        const featureUnwatch = watch(
          () => newMapComponent.selectedFeatureId,
          (newSelectedFeatureId) => {
            if (newSelectedFeatureId) {
              // Add the selected feature to the compare store
              compareStore.toggleNeighborhood(newSelectedFeatureId)

              // Also log the feature properties for debugging
              console.log('Selected feature:', newSelectedFeatureId, newMapComponent.hoveredFeature)
            }
          }
        )
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <div class="map-panel">
    <SharedMap ref="mapComponent" :visible-layer-id="layerId" class="maplibre-container" />
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
