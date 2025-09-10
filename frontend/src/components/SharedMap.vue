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

// Create a simplified layer config for MapLibreMap
const specificLayerConfig = computed(() => {
  if (!fullLayerConfig.value) return null
  return {
    id: fullLayerConfig.value.layer.id,
    source: fullLayerConfig.value.source,
    layer: fullLayerConfig.value.layer,
    label: fullLayerConfig.value.label
  }
})

// Handle map loaded event
const handleMapLoaded = () => {
  // Map is loaded with its specific layer, no need to sync visibility
  // console.log('Map loaded with specific layer:', props.visibleLayerId)
}
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
      :key="`${cityStore.city}-${props.visibleLayerId || 'no-layer'}`"
      :center="mapCenter"
      :zoom="mapZoom"
      :max-zoom="20"
      :min-zoom="6"
      style-spec="style/style.json"
      :callback-loaded="handleMapLoaded"
      :popup-layer-ids="fullLayerConfig ? [fullLayerConfig.layer.id] : []"
      :specific-layer="specificLayerConfig"
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
