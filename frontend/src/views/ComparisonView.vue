<script setup lang="ts">
import { useCompareStore } from '@/stores/compare'
import { useLayersStore } from '@/stores/layers'
import LayerGroups from '@/components/LayerGroups.vue'
import MapGrid from '@/components/MapGrid.vue'
import TableTab from '@/components/TableTab.vue'
import { useCityStore } from '@/stores/city'

const compareStore = useCompareStore()
const layersStore = useLayersStore()
const cityStore = useCityStore()
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
            <!-- Use the updated LayerGroups component -->
            <LayerGroups />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col id="map-time-input-container" xl="10" cols="9" class="py-0 pl-0 d-flex flex-column">
        <!-- Maps Container - Takes most of the space -->
        <div class="maps-container flex-grow-1">
          <MapGrid v-if="layersStore.selectedLayers.length > 0" class="pa-2 fill-height" />
          <div v-else class="d-flex align-center justify-center fill-height">
            <v-alert type="info" prominent>
              Please select at least one layer to display maps.
            </v-alert>
          </div>
        </div>

        <!-- Table Container - Fixed height at bottom -->
        <div class="table-container" style="height: 400px">
          <TableTab />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.params-col {
  max-height: 100vh;
}
</style>
