<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useLayersStore } from '@/stores/layers'
import { useCityStore } from '@/stores/city'
import MapLibreMap from '@/components/MapLibreMap.vue'
import LegendMap from '@/components/LegendMap.vue'
import { useMapEvents } from '@/composables/useMapEvents'
import type { Map } from 'maplibre-gl'
import type { MapLayerConfig } from '@/config/layerTypes'

const props = defineProps<{
  visibleLayerId?: string
  onViewChange?: (viewState: any) => void
}>()

const layersStore = useLayersStore()
const cityStore = useCityStore()
const map = ref<InstanceType<typeof MapLibreMap> | null>(null)
const mapInstance = ref<Map | undefined>(undefined)

// Use the map events composable
const mapEventManager = useMapEvents(mapInstance as any)

// Watch for map component changes and get the actual map instance
watch(
  () => map.value?.getMap(),
  (newMapInstance) => {
    if (newMapInstance) {
      mapInstance.value = newMapInstance
    }
  },
  { immediate: true }
)

// derive center/zoom from city store
const mapCenter = computed(() => cityStore.current.center)
const mapZoom = computed(() => cityStore.current.zoom)

// Get the full layer config with source and layer details
const fullLayerConfig = computed(() => {
  if (!props.visibleLayerId) return null
  const mapConfig = layersStore.visibleLayers.find((l) => l.layer.id === props.visibleLayerId)
  return mapConfig
})

// Sync layer visibility with the map
const syncLayerVisibility = () => {
  if (map.value && props.visibleLayerId) {
    try {
      // Hide all layers first
      layersStore.possibleLayers.forEach((layer) => {
        try {
          map.value?.setLayerVisibility(layer.id, false)
        } catch (e) {
          // Ignore errors for layers that might not be loaded yet
        }
      })

      // Then show only the selected layer
      try {
        map.value.setLayerVisibility(props.visibleLayerId, true)
      } catch (e) {
        // Ignore errors for layers that might not be loaded yet
      }
    } catch (e) {
      // Ignore errors during visibility sync
    }
  }
}

// Handle map loaded event
const handleMapLoaded = () => {
  // Small delay to ensure map is fully initialized
  setTimeout(() => {
    syncLayerVisibility()
  }, 100)
}

// Watch for changes in visible layer
watch(
  () => props.visibleLayerId,
  () => {
    syncLayerVisibility()
  },
  { immediate: true }
)

// Also watch for city changes
watch(
  () => cityStore.city,
  () => {
    // City changed, map will be reloaded
  },
  { immediate: false }
)

// Sync view changes
const handleMove = () => {
  if (map.value && props.onViewChange) {
    const mapView = map.value.getMap()
    if (mapView) {
      props.onViewChange({
        center: mapView.getCenter(),
        zoom: mapView.getZoom(),
        bearing: mapView.getBearing(),
        pitch: mapView.getPitch()
      })
    }
  }
}

// Expose map methods and events
defineExpose({
  getMap: () => mapInstance.value,
  setLayerVisibility: (layerId: string, visibility: boolean) => {
    map.value?.setLayerVisibility(layerId, visibility)
  },
  selectedFeatureId: mapEventManager.selectedFeatureId,
  hoveredFeature: mapEventManager.hoveredFeature
})
</script>

<template>
  <div class="shared-map">
    <MapLibreMap
      ref="map"
      :key="cityStore.city"
      :center="mapCenter"
      :zoom="mapZoom"
      :max-zoom="20"
      :min-zoom="6"
      style-spec="style/style.json"
      :callback-loaded="handleMapLoaded"
      :popup-layer-ids="fullLayerConfig ? [fullLayerConfig.layer.id] : []"
      class="maplibre-container"
      @move="handleMove"
    >
      <template #legend>
        <LegendMap v-if="fullLayerConfig" :layers="[fullLayerConfig]" />
      </template>
    </MapLibreMap>
  </div>
</template>

<style scoped>
.shared-map {
  position: relative;
  height: 100%;
  width: 100%;
}

.maplibre-container {
  position: absolute;
  inset: 0;
}
</style>
