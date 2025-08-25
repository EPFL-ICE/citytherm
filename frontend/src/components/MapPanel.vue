<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useLayersStore } from '@/stores/layers'
import { useCompareStore } from '@/stores/compare'
import { useFeatureSelections } from '@/stores/useFeatureSelections'
import SharedMap from '@/components/SharedMap.vue'

const props = defineProps<{
  layerId: string
}>()

const layersStore = useLayersStore()
const compareStore = useCompareStore()
const featureSelections = useFeatureSelections()
const mapComponent = ref<InstanceType<typeof SharedMap> | null>(null)

// Get basic layer info
const layerInfo = computed(() => {
  console.log('MapPanel layerId:', props.layerId)
  return layersStore.possibleLayers.find((layer) => layer.id === props.layerId)
})

// Watch for changes in feature selections and synchronize with compare store
watch(
  () => featureSelections.items,
  (newItems) => {
    // Get the current selected neighborhood IDs from the feature selections
    const currentFeatureIds = newItems.map((item) => item.id.toString())

    // Get the current selected neighborhood IDs from the compare store
    const currentCompareIds = compareStore.selectedNeighborhoodIds

    // Find items that were added
    const addedIds = currentFeatureIds.filter((id) => !currentCompareIds.includes(id))

    // Find items that were removed
    const removedIds = currentCompareIds.filter((id) => !currentFeatureIds.includes(id))

    // Add new items to compare store
    addedIds.forEach((id) => {
      compareStore.toggleNeighborhood(id)
    })

    // Remove deleted items from compare store
    removedIds.forEach((id) => {
      compareStore.toggleNeighborhood(id)
    })
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  // Initialize feature selections for the current city
  featureSelections.hydrate()

  // Set up a watcher to get the map instance when it's available
  const unwatch = watch(
    () => mapComponent.value,
    (newMapComponent) => {
      if (newMapComponent) {
        // The useMapEvents composable already handles updating the featureSelections store
        // We don't need to manually watch selectedFeatureId and update the compare store
        // The synchronization is handled by the watcher above
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <div class="map-panel">
    <SharedMap ref="mapComponent" :visible-layer-id="layerId" class="maplibre-container" />
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
