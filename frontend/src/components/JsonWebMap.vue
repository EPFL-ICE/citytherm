<script setup lang="ts">
import MapLibreMap from '@/components/MapLibreMap.vue'
import SelectionPanel from '@/components/SelectionPanel.vue'
import LstDatePicker from '@/components/LstDatePicker.vue'
import GeoTiffLayer from '@/components/GeoTiffLayer.vue'

import { ref, shallowRef, watch, computed } from 'vue'
import LegendMap from '@/components/LegendMap.vue'
import LayerGroups from '@/components/LayerGroups.vue'
import { useLayersStore } from '@/stores/layers'
import { useCityStore } from '@/stores/city'
import { getMapConfig } from '@/config/mapConfig'
import type { Parameters } from '@/utils/jsonWebMap'

const map = ref<InstanceType<typeof MapLibreMap>>()

const parameters = shallowRef<Parameters>({
  popupLayerIds: [
    'building_height-layer',
    'sky_view_factor-layer',
    'frontal_area-layer',
    'aspect_ratio-layer',
    'water_fraction-layer',
    'impervious_fraction-layer',
    'building_fraction-layer',
    'pervious_fraction-layer',
    // 'intersections-layer',
    // 'length_ns-layer',
    // 'length_ne_sw-layer',
    // 'length_se_nw-layer',
    // 'length_e_w-layer',
    'primary_road_len-layer',
    'secondary_road_len-layer',
    'highway_len-layer',
    'lcz_typology-layer',
    'irr_summer-layer',
    'irr_winter-layer',
    'lst_measurement-layer',
    'lst_geotiff-layer'
  ]
})

const layersStore = useLayersStore()
const cityStore = useCityStore()

// LST GeoTIFF state
const selectedLstFile = ref<string>('')
const isLstLayerVisible = ref<boolean>(true)

// Check if any LST layer is selected
const isLstLayerSelected = computed(() => {
  // Get the current map configuration
  const mapConfig = getMapConfig(cityStore.city)

  // Check if any selected layer has hasDatePicker: true
  return layersStore.selectedLayers.some((layerId) => {
    const layerConfig = mapConfig.layers.find((layer: any) => layer.layer.id === layerId)
    return layerConfig?.hasDatePicker === true
  })
})

// derive center/zoom from city store
const mapCenter = computed(() => cityStore.current.center)
const mapZoom = computed(() => cityStore.current.zoom)

// Handle LST date selection
const onLstDateSelected = (filename: string) => {
  selectedLstFile.value = filename
}

// Handle GeoTIFF load event
const onGeoTiffLoad = () => {
  console.log('GeoTIFF loaded successfully')
}

// Handle GeoTIFF error event
const onGeoTiffError = (error: Error) => {
  console.error('Error loading GeoTIFF:', error)
}

// Sync layer visibility with the map when the selected layers change
const syncAllLayersVisibility = (layersSelected: string[]) => {
  for (let { id: layerID } of layersStore.possibleLayers) {
    if (layersSelected.includes(layerID)) {
      map.value?.setLayerVisibility(layerID, true)
    } else {
      map.value?.setLayerVisibility(layerID, false)
    }
  }
}

watch(() => layersStore.selectedLayers, syncAllLayersVisibility, { immediate: true, deep: true })

const style = ref('style/style.json') // Default style
</script>

<template>
  <v-container class="fill-height pa-0 overflow-hidden" fluid>
    <v-row class="fill-height overflow-y-hidden">
      <v-col xl="2" cols="3" class="params-col border-e-md overflow-y-auto overflow-x-hidden">
        <v-card flat>
          <v-card-text class="pa-2">
            <v-select
              v-model="cityStore.city"
              :items="cityStore.cities"
              item-value="value"
              item-title="label"
              label="City"
              density="comfortable"
              hide-details
              variant="outlined"
            />
          </v-card-text>
          <v-card-title class="ml-2"> <h4 class="text-center mb-12 mt-6">LAYERS</h4> </v-card-title>
          <v-card-text class="d-flex flex-column">
            <!-- Use the new LayerGroups component -->
            <LayerGroups />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        id="map-time-input-container"
        xl="10"
        cols="9"
        class="py-0 pl-0 d-flex flex-column position-relative"
      >
        <div v-if="isLstLayerSelected" class="lst-controls">
          <LstDatePicker :city="cityStore.city" @date-selected="onLstDateSelected" />
        </div>
        <MapLibreMap
          :key="style + cityStore.city"
          ref="map"
          :center="mapCenter"
          :style-spec="style"
          :popup-layer-ids="parameters.popupLayerIds"
          :zoom="mapZoom"
          :max-zoom="20"
          :min-zoom="6"
          :callback-loaded="() => syncAllLayersVisibility(layersStore.selectedLayers)"
          class="flex-grow-1"
        >
          <template #legend>
            <legend-map :layers="layersStore.visibleLayers"></legend-map>
          </template>
        </MapLibreMap>
        <GeoTiffLayer
          v-if="selectedLstFile && isLstLayerSelected"
          :url="`/geodata/lst/${selectedLstFile}`"
          :map="map?.getMap()"
          :visible="isLstLayerVisible"
          @load="onGeoTiffLoad"
          @error="onGeoTiffError"
        />
        <SelectionPanel class="map-selections-overlay" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-slider-thumb__label span.thumb-label-nowrap {
  white-space: nowrap;
}

.params-col {
  max-height: 100vh;
}

.no-min-height {
  height: 32px;
}

.map-selections-overlay {
  position: absolute;
  bottom: 10px;
  left: 10px;
  max-width: 400px;
  z-index: 1000;
}

.lst-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
