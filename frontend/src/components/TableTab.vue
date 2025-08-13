<script setup lang="ts">
import { computed } from 'vue'
import { useCompareStore } from '@/stores/compare'
import { useLayersStore } from '@/stores/layers'
import { toCSV } from '@/utils/exportUtils'
import type { MapLayerConfig } from '@/config/layerTypes'

const compareStore = useCompareStore()
const layersStore = useLayersStore()

// Create a map of layer ID to layer config for easy lookup
const layerMap = computed<Record<string, MapLayerConfig>>(() => {
  const map: Record<string, MapLayerConfig> = {}
  layersStore.visibleLayers.forEach((layer) => {
    map[layer.layer.id] = layer
  })
  return map
})

// Get the selected layer configs
const selectedLayerConfigs = computed(() => {
  return compareStore.selectedLayerIds.map((id) => layerMap.value[id]).filter(Boolean)
})

// Check if we have data to display
const hasData = computed(() => {
  return compareStore.selectedNeighborhoodIds.length > 0 && compareStore.selectedLayerIds.length > 0
})

// Check if we have no selections
const isEmpty = computed(() => {
  return (
    compareStore.selectedNeighborhoodIds.length === 0 && compareStore.selectedLayerIds.length === 0
  )
})

function exportCSV() {
  toCSV(compareStore.tableData, compareStore.selectedLayerIds, layerMap.value)
}
</script>

<template>
  <div class="table-tab fill-height d-flex flex-column">
    <div class="controls d-flex justify-end pa-2">
      <v-btn v-if="hasData" color="primary" prepend-icon="mdi-download" @click="exportCSV">
        Download CSV
      </v-btn>
    </div>

    <div v-if="isEmpty" class="empty-state fill-height d-flex align-center justify-center">
      <v-alert type="info" prominent>
        Please select neighborhoods and layers to view data.
      </v-alert>
    </div>

    <div v-else-if="!hasData" class="empty-state fill-height d-flex align-center justify-center">
      <v-alert type="info" prominent>
        Please select both neighborhoods and layers to view data.
      </v-alert>
    </div>

    <v-data-table
      v-else
      :headers="[
        { title: 'Neighborhood ID', key: 'uid' },
        { title: 'Label', key: 'label' },
        ...selectedLayerConfigs.map((layer) => ({
          title: layer?.label || '',
          key: `values.${layer?.layer.id}`
        }))
      ]"
      :items="compareStore.tableData"
      class="flex-grow-1"
    >
      <template #item="{ item }">
        <tr>
          <td>{{ item.uid }}</td>
          <td>{{ item.label || '' }}</td>
          <td v-for="layer in selectedLayerConfigs" :key="layer?.layer.id">
            {{ item.values[layer?.layer.id] || '-' }}
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.table-tab {
  height: 100%;
}

.controls {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.empty-state {
  background-color: #f5f5f5;
}
</style>
