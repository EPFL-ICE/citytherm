<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import { getMapConfig } from '@/config/mapConfig'
import { useMapEvents } from '@/composables/useMapEvents'

import {
  FullscreenControl,
  Map,
  NavigationControl,
  ScaleControl,
  VectorTileSource,
  type FilterSpecification,
  type LngLatLike,
  type StyleSetterOptions,
  type StyleSpecification,
  addProtocol
} from 'maplibre-gl'
import type { LegendColor } from '@/utils/legendColor'
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { useFeatureSelections } from '@/stores/useFeatureSelections'

import { Protocol } from 'pmtiles'
import { cogProtocol } from '@geomatico/maplibre-cog-protocol'
import { useLayersStore } from '@/stores/layers'
import { useCityStore } from '@/stores/city'

const layersStore = useLayersStore()
const cityStore = useCityStore()
const featureSelections = useFeatureSelections()

// Define types for our layer configuration
interface LayerConfig {
  id: string
  source: any
  layer: any
  label?: string
}

const props = withDefaults(
  defineProps<{
    styleSpec: string | StyleSpecification
    center?: LngLatLike
    zoom?: number
    aspectRatio?: number
    minZoom?: number
    maxZoom?: number
    filterIds?: string[]
    popupLayerIds?: string[]
    areaLayerIds?: string[]
    idxImage?: number
    variableSelected?: string
    legendColors?: LegendColor[]
    callbackLoaded?: () => void
    // New prop for specific layer to display
    specificLayer?: LayerConfig | null
    // New prop for fitBounds functionality
    fitBounds?: boolean
    padding?: number
  }>(),
  {
    center: undefined,
    zoom: 12,
    idxImage: 0,
    variableSelected: 't2',
    aspectRatio: undefined,
    minZoom: undefined,
    maxZoom: undefined,
    filterIds: undefined,
    legendColors: undefined,
    callbackLoaded: undefined,
    popupLayerIds: () => [],
    areaLayerIds: () => [],
    specificLayer: null,
    fitBounds: false,
    padding: 20
  }
)

const loading = ref(true)
const container = ref<HTMLDivElement | null>(null)
const map = ref<any | undefined>(undefined)
const hasLoaded = ref(false)
const protocol = new Protocol()

// Use the map events composable
const mapEventManager = useMapEvents(map as Ref<Map | undefined>)

// Add PMTiles protocol only once
let protocolAdded = false
function addPMTilesProtocol() {
  if (!protocolAdded) {
    addProtocol('pmtiles', protocol.tile)
    protocolAdded = true
  }
}

// Add selection source and layers to the map
function addSelectionLayers() {
  if (!map.value) return

  // Add selection source
  if (!map.value.getSource('selected')) {
    map.value.addSource('selected', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
  }

  // Add selection circle layer
  if (!map.value.getLayer('selected-circles')) {
    try {
      map.value.addLayer({
        id: 'selected-circles',
        type: 'circle',
        source: 'selected',
        paint: {
          'circle-radius': 14,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#000000',
          'circle-stroke-width': 1
        }
      })
    } catch (error) {
      console.error('Error adding selected-circles layer:', error)
    }
  }

  // Add selection label layer
  if (!map.value.getLayer('selected-labels')) {
    const labelLayer = {
      id: 'selected-labels',
      type: 'symbol',
      source: 'selected',
      layout: {
        'text-field': ['to-string', ['get', 'label']],
        'text-size': 14,
        'text-allow-overlap': true
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    }
    try {
      map.value.addLayer(labelLayer)
    } catch (error) {
      console.error('Error adding selected-labels layer:', error)
    }
  }

  // Ensure the layers are visible
  if (map.value.getLayer('selected-circles')) {
    map.value.setLayoutProperty('selected-circles', 'visibility', 'visible')
  }
  if (map.value.getLayer('selected-labels')) {
    map.value.setLayoutProperty('selected-labels', 'visibility', 'visible')
  }

  // Move layers to top to ensure they're visible above all other layers
  setTimeout(() => {
    try {
      if (map.value.getLayer('selected-circles')) {
        map.value.moveLayer('selected-circles')
      }
      if (map.value.getLayer('selected-labels')) {
        map.value.moveLayer('selected-labels')
      }
    } catch (e) {
      console.warn('Error moving layers to top:', e)
    }

    // Immediately update the selection source with existing feature selections
    updateSelectionSource()
  }, 100)
}
// Update selection source data when selections change
function updateSelectionSource() {
  if (!map.value) return
  const source = map.value.getSource('selected')
  if (source) {
    source.setData(featureSelections.featureCollection)
  }
}

// Watch for selection changes and update the map
// We watch the featureCollection getter directly to ensure we catch all changes
watch(() => featureSelections.featureCollection, updateSelectionSource, { deep: true })

function initMap() {
  // Add PMTiles protocol
  addPMTilesProtocol()

  // Add COG protocol
  addProtocol('cog', cogProtocol)
  const newMap = new Map({
    container: container.value as HTMLDivElement,
    style: props.styleSpec,
    center: props.center,
    zoom: props.zoom,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    attributionControl: false
  }) as Map

  map.value = newMap

  const mapInstance = map.value as Map

  // map.showTileBoundaries = true
  mapInstance.addControl(new NavigationControl({}))
  mapInstance.addControl(new ScaleControl({}))
  mapInstance.addControl(
    new FullscreenControl({
      container: document.getElementById('map-time-input-container') ?? undefined
    })
  )

  mapInstance.on('load', () => {
    if (!map.value) return
    hasLoaded.value = true
    loading.value = false
    // Add error handling for resize call
    try {
      if (container.value) {
        map.value.resize()
      }
    } catch (error) {
      console.warn('Error resizing map:', error)
    }

    // Apply fitBounds if requested
    if (props.fitBounds && cityStore.current.boundingBox) {
      // Use fitBounds to adjust the zoom level to fit the bounding box
      map.value.fitBounds(cityStore.current.boundingBox, {
        padding: props.padding
      })
    }

    // Add base style layers from the style specification
    // These are shared across all maps

    // Add the specific layer if provided
    if (props.specificLayer) {
      try {
        // Extract source ID from the layer configuration
        const sourceId = props.specificLayer.layer.source
        map.value?.addSource(sourceId, props.specificLayer.source)
        map.value?.addLayer(props.specificLayer.layer)
        // Attach popup listeners for the specific layer if it should have them
        if (props.popupLayerIds?.includes(props.specificLayer.layer.id)) {
          mapEventManager.attachPopupListeners(
            props.specificLayer.layer.id,
            props.specificLayer.label ?? ''
          )
        }
      } catch (e) {
        // Ignore errors when adding sources/layers
        console.warn(`Failed to add specific source/layer:`, e)
      }
    }

    // Add selection layers after all other layers
    addSelectionLayers()

    function handleDataEvent() {
      if (map.value?.areTilesLoaded()) {
        loading.value = false
      } else {
        loading.value = true
      }
    }

    // Attach popup listeners to each layer using our composable
    // mapConfig.layers.forEach((layer) => attachPopupListeners(layer.layer.id, layer.label))

    mapInstance.on('sourcedata', handleDataEvent)
    mapInstance.on('sourcedataloading', handleDataEvent)
    mapInstance.on('idle', () => {
      loading.value = false
    })

    if (props.callbackLoaded) {
      props.callbackLoaded()
    }
  })
}

onMounted(() => {
  initMap()

  // Listen for force update events from TableTab
  window.addEventListener('force-map-update', updateSelectionSource)
})

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('force-map-update', updateSelectionSource)
})

const setFilter = (
  layerId: string,
  filter?: FilterSpecification | null | undefined,
  options?: StyleSetterOptions | undefined
) => {
  // Guard: layer may not yet be added when watchers fire (immediate watch before map load)
  if (!map.value || !map.value.getLayer(layerId)) return
  map.value?.setFilter(layerId, filter, options)
}

const getFilter = (layerId: string) => {
  if (!map.value || !map.value.getLayer(layerId)) return undefined
  return map.value?.getFilter(layerId)
}

const setPaintProperty = (
  layerId: string,
  name: string,
  value: any,
  options?: StyleSetterOptions | undefined
) => {
  if (!map.value || !map.value.getLayer(layerId)) return
  map.value?.setPaintProperty(layerId, name, value, options)
}

const queryFeatures = (filter: any[]) => {
  return map.value?.querySourceFeatures('trajectories', {
    sourceLayer: 'trajectories',
    filter: filter as FilterSpecification,
    validate: false
  })
}

const queryRenderedFeatures = () => {
  return map.value?.queryRenderedFeatures()
}

const onZoom = (callback: () => void) => {
  map.value?.on('zoom', callback)
}

const changeSourceTilesUrl = (sourceId: string, url: string) => {
  const source = map.value?.getSource(sourceId) as VectorTileSource
  source.setUrl(url)
}

const getSourceTilesUrl = (sourceId: string) => {
  const source = map.value?.getSource(sourceId) as VectorTileSource
  if (source && source.url) return source.url
  else return ''
}
const setLayerVisibility = (layerId: string, visibility: boolean) => {
  if (!map.value || !map.value.getLayer(layerId)) return // Avoid errors if layer not yet present
  const mapConfig = getMapConfig(cityStore.city)
  const layerLabel = mapConfig.layers.find((layer) => layer.layer.id === layerId)?.label
  if (visibility) mapEventManager.attachPopupListeners(layerId, layerLabel ?? '')
  else mapEventManager.detachPopupListeners(layerId)
  map.value?.setLayoutProperty(layerId, 'visibility', visibility ? 'visible' : 'none')
}

const getPaintProperty = (layerId: string, name: string) => {
  if (!hasLoaded.value || !map.value || !map.value.getLayer(layerId)) return undefined
  return map.value?.getPaintProperty(layerId, name)
}

// Filter categorical layers by categories
watch(
  () => layersStore.filteredCategories,
  (filteredCategories) => {
    Object.entries(filteredCategories).forEach(([layerID, variablesRecord]) => {
      Object.entries(variablesRecord).forEach(([variable, categories]) => {
        const categoriesListToFilter = [...categories]

        if (categoriesListToFilter.length > 0) {
          const filter = [
            '!',
            ['in', ['get', variable], ['literal', categoriesListToFilter]]
          ] as FilterSpecification
          setFilter(layerID, filter)
        } else if (categoriesListToFilter.length == 0) {
          setFilter(layerID, null)
        }
      })
    })
  },
  { deep: true }
)

// Automatic pitch change when 3D layers are added or removed
watch(
  () => layersStore.visibleLayers,
  (visibleLayers, oldVisibleLayers) => {
    const oldThreeDimLayers = oldVisibleLayers.filter(
      (layer) => layer.layer.type === 'fill-extrusion'
    )
    const threeDimLayers = visibleLayers.filter((layer) => layer.layer.type === 'fill-extrusion')
    const had3DLayer = oldThreeDimLayers.length > 0
    const has3DLayer = threeDimLayers.length > 0

    if (!had3DLayer && has3DLayer) {
      if (map.value?.getPitch() === 0)
        map.value?.easeTo({ pitch: 40, center: map.value?.getCenter() })
    } else if (had3DLayer && !has3DLayer) {
      map.value?.easeTo({ pitch: 0, center: map.value?.getCenter() })
    }
  }
)

// Watch for city changes and reload map sources
watch(
  () => cityStore.city,
  () => {
    if (!map.value || !hasLoaded.value) return

    // Get the new configuration for the selected city
    const mapConfig = getMapConfig(cityStore.city)

    // Update sources for grid-based layers only if URLs actually changed
    mapConfig.layers.forEach((layerConfig) => {
      const src = layerConfig.source as any
      if (src?.url && /pmtiles:\/\/.*\/(geneva|zurich)_grid_data\.pmtiles$/.test(src.url)) {
        // Get the current source URL
        const currentSource = map.value?.getSource(layerConfig.id) as VectorTileSource
        const currentUrl = currentSource?.url

        // Only update if the URL has actually changed
        if (currentUrl !== src.url) {
          map.value?.getSource(layerConfig.id)?.setUrl(src.url)
        }
      }
    })
  }
)

// Method to programmatically trigger fitBounds
const fitToBounds = () => {
  if (map.value && cityStore.current.boundingBox) {
    map.value.fitBounds(cityStore.current.boundingBox, {
      padding: props.padding
    })
  }
}

defineExpose({
  getPaintProperty,
  setFilter,
  getFilter,
  queryFeatures,
  queryRenderedFeatures,
  setPaintProperty,
  onZoom,
  changeSourceTilesUrl,
  setLayerVisibility,
  getSourceTilesUrl,
  getMap: () => map.value,
  fitToBounds
})

watch(
  () => props.styleSpec,
  (styleSpec) => {
    map.value?.setStyle(styleSpec)
  },
  { immediate: true }
)
</script>

<template>
  <v-container class="pa-0 position-relative fill-height" fluid>
    <div ref="container" class="map fill-height">
      <loading-circle :loading="loading" />
    </div>
    <slot name="legend"></slot>
  </v-container>
</template>

<style scoped>
.map {
  height: 100%;
  width: 100%;
  position: relative;
}

.map:deep(.hovered-feature) {
  cursor: pointer !important;
}
</style>

<style>
/* Global styles for the popup (not scoped) */
.feature-popup .maplibregl-popup-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 10px;
  font-family: inherit;
  overflow-y: auto;
  max-height: 500px;
}

.popup-table {
  border-collapse: collapse;
  width: 100%;
}

.popup-content > h3 {
  margin-bottom: 1rem;
}

.popup-table tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.05);
}

.popup-table td {
  padding: 4px 6px;
  font-size: small;
}

.property-name {
  font-weight: bold;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  font-size: smaller;
}

.property-value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
