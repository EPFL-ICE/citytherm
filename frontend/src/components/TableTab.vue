<script setup lang="ts">
import { computed } from 'vue'
import { useCompareStore } from '@/stores/compare'
import { useLayersStore } from '@/stores/layers'
import { useFeatureSelections } from '@/stores/useFeatureSelections'
import { toCSV } from '@/utils/exportUtils'
import type { MapLayerConfig } from '@/config/layerTypes'

const compareStore = useCompareStore()
const layersStore = useLayersStore()
const featureSelections = useFeatureSelections()

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
  return featureSelections.items.length > 0
})

// Check if we have no selections
const isEmpty = computed(() => {
  return featureSelections.items.length === 0
})

function exportCSV() {
  // Convert featureSelections.items to the format expected by toCSV
  const tableData = featureSelections.items.map((item) => ({
    uid: item.id.toString(),
    label: `Cell ${item.id}`,
    values: item.props
  }))
  toCSV(tableData, Object.keys(tableData[0]?.values || {}), layerMap.value)
}

// Convert featureSelections.items to the format expected by the table
const tableData = computed(() => {
  return featureSelections.items.map((item) => ({
    uid: item.id.toString(),
    label: `Cell ${item.id}`,
    values: item.props
  }))
})
</script>

<template>
  <div class="table-tab fill-height d-flex flex-column">
    <div class="controls d-flex justify-end pa-2">
      <v-btn v-if="hasData" color="primary" prepend-icon="mdi-download" @click="exportCSV">
        Download CSV
      </v-btn>
    </div>

    <v-data-table
      v-if="hasData"
      :headers="[
        { title: 'ID', key: 'uid' },
        { title: 'Label', key: 'label' },
        ...Object.keys(featureSelections.items[0]?.props || {}).map((propKey) => ({
          title: propKey,
          key: `values.${propKey}`
        }))
      ]"
      :items="tableData"
      class="flex-grow-1"
    >
      <template #item="{ item }">
        <tr>
          <td>{{ item.uid }}</td>
          <td>{{ item.label || '' }}</td>
          <td
            v-for="propKey in Object.keys(featureSelections.items[0]?.props || {})"
            :key="propKey"
          >
            {{ item.values[propKey] || '-' }}
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
