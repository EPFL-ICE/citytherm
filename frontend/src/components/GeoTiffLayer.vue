<template>
  <div ref="geoTiffContainer" class="geotiff-layer-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Map } from 'maplibre-gl'

// Props
const props = defineProps<{
  url: string
  map: Map | null
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error', error: Error): void
}>()

// Generate unique layer ID
const layerId = `geotiff-layer-${Math.random().toString(36).substr(2, 9)}`
const sourceId = `geotiff-source-${Math.random().toString(36).substr(2, 9)}`

// Load GeoTIFF layer
const loadGeoTiffLayer = () => {
  if (!props.map || !props.url) return

  try {
    // Remove existing layer and source if they exist
    if (props.map.getLayer(layerId)) {
      props.map.removeLayer(layerId)
    }
    if (props.map.getSource(sourceId)) {
      props.map.removeSource(sourceId)
    }

    // Add source using COG protocol
    props.map.addSource(sourceId, {
      type: 'raster',
      url: `cog://${props.url}`,
      tileSize: 256
    })

    // Add layer
    props.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.7
      }
    })

    // Set initial visibility
    props.map.setLayoutProperty(layerId, 'visibility', props.visible ? 'visible' : 'none')

    emit('load')
  } catch (error) {
    console.error('Error loading GeoTIFF:', error)
    emit('error', error as Error)
  }
}

// Toggle layer visibility
const toggleLayerVisibility = () => {
  if (!props.map || !props.map.getLayer(layerId)) return

  props.map.setLayoutProperty(layerId, 'visibility', props.visible ? 'visible' : 'none')
}

// Watch for URL changes
watch(
  () => props.url,
  () => {
    loadGeoTiffLayer()
  }
)

// Watch for visibility changes
watch(
  () => props.visible,
  () => {
    toggleLayerVisibility()
  }
)

// Lifecycle hooks
onMounted(() => {
  loadGeoTiffLayer()
})

onUnmounted(() => {
  if (props.map) {
    if (props.map.getLayer(layerId)) {
      props.map.removeLayer(layerId)
    }
    if (props.map.getSource(sourceId)) {
      props.map.removeSource(sourceId)
    }
  }
})

// Expose methods
defineExpose({
  loadGeoTiffLayer,
  toggleLayerVisibility
})
</script>

<style scoped>
.geotiff-layer-container {
  display: none;
}
</style>
