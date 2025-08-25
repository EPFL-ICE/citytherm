<template>
  <div ref="geoTiffContainer" class="geotiff-layer-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import GeoRaster from 'georaster'
import GeoRasterLayer from 'georaster-layer-for-leaflet'
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

// Refs
const geoTiffContainer = ref<HTMLDivElement | null>(null)
let geoRasterLayer: any = null

// Load GeoTIFF layer
const loadGeoTiffLayer = async () => {
  if (!props.map || !props.url) return

  try {
    // Remove existing layer if it exists
    if (geoRasterLayer) {
      props.map.removeLayer(geoRasterLayer)
      geoRasterLayer = null
    }

    // Load the GeoTIFF
    const geoRaster = await GeoRaster(props.url)

    // Create the GeoRasterLayer
    geoRasterLayer = new GeoRasterLayer({
      georaster: geoRaster,
      opacity: 0.7
    })

    // Add layer to map if visible
    if (props.visible) {
      geoRasterLayer.addTo(props.map)
    }

    emit('load')
  } catch (error) {
    console.error('Error loading GeoTIFF:', error)
    emit('error', error as Error)
  }
}

// Toggle layer visibility
const toggleLayerVisibility = () => {
  if (!geoRasterLayer || !props.map) return

  if (props.visible) {
    if (!props.map.hasLayer(geoRasterLayer)) {
      geoRasterLayer.addTo(props.map)
    }
  } else {
    if (props.map.hasLayer(geoRasterLayer)) {
      props.map.removeLayer(geoRasterLayer)
    }
  }
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
  if (geoRasterLayer && props.map && props.map.hasLayer(geoRasterLayer)) {
    props.map.removeLayer(geoRasterLayer)
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
