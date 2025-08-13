<script setup lang="ts">
import MapLibreMap from '@/components/MapLibreMap.vue'

import { ref, shallowRef, watch, computed } from 'vue'
import LegendMap from '@/components/LegendMap.vue'
import LayerGroups from '@/components/LayerGroups.vue'
import { useLayersStore } from '@/stores/layers'
import { useCityStore } from '@/stores/city'
import type { Parameters } from '@/utils/jsonWebMap'

const map = ref<InstanceType<typeof MapLibreMap>>()

const parameters = shallowRef<Parameters>({})

const layersStore = useLayersStore()
const cityStore = useCityStore()

// derive center/zoom from city store
const mapCenter = computed(() => cityStore.current.center)
const mapZoom = computed(() => cityStore.current.zoom)

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
      <v-col id="map-time-input-container" xl="10" cols="9" class="py-0 pl-0 d-flex flex-column">
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
</style>
