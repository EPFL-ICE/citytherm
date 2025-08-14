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

// Mapping of layer groups to their relevant properties
const layerGroupProperties: Record<string, string[]> = {
  urban_morphology: ['Building height', 'Sky view factor', 'Frontal area index', 'Aspect ratio'],
  land_cover_fraction: [
    'Water cover fraction',
    'Impervious surface cover fraction',
    'Building cover fraction',
    'Pervious surface cover fraction'
  ],
  canyon_network: [
    'Intersections',
    'Length N-S',
    'Length NE-SW',
    'Length SE-NW',
    'Length E-W',
    'Length primary road',
    'Length secondary road',
    'Length highway'
  ],
  local_climate_zones: ['lcz_typology'],
  irradiance: ['solar_summer', 'solar_winter_2'],
  land_surface_temperature: ['lst_measurement']
}

// Helper function to get layer group ID from layer ID
function getLayerGroupId(layerId: string): string | null {
  // Remove '-layer' suffix if present
  const baseLayerId = layerId.replace('-layer', '')

  // Map layer IDs to group IDs
  const layerToGroupMap: Record<string, string> = {
    building_height: 'urban_morphology',
    sky_view_factor: 'urban_morphology',
    frontal_area: 'urban_morphology',
    aspect_ratio: 'urban_morphology',
    water_fraction: 'land_cover_fraction',
    impervious_fraction: 'land_cover_fraction',
    building_fraction: 'land_cover_fraction',
    pervious_fraction: 'land_cover_fraction',
    intersections: 'canyon_network',
    length_ns: 'canyon_network',
    length_ne_sw: 'canyon_network',
    length_se_nw: 'canyon_network',
    length_e_w: 'canyon_network',
    primary_road_len: 'canyon_network',
    secondary_road_len: 'canyon_network',
    highway_len: 'canyon_network',
    lcz_typology: 'local_climate_zones',
    irr_summer: 'irradiance',
    irr_winter: 'irradiance',
    lst_measurement: 'land_surface_temperature'
  }

  return layerToGroupMap[baseLayerId] || null
}

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

// Get unique layer group IDs from selected layers
const selectedLayerGroupIds = computed(() => {
  const groupIds = layersStore.selectedLayers
    .map(getLayerGroupId)
    .filter((id): id is string => id !== null)
  return [...new Set(groupIds)]
})

// Get relevant properties for selected layer groups
const relevantProperties = computed(() => {
  if (selectedLayerGroupIds.value.length === 0) {
    // If no groups selected, return all properties from the first item
    return Object.keys(featureSelections.items[0]?.props || {})
  }

  // Combine properties from all selected layer groups
  const properties = new Set<string>()
  selectedLayerGroupIds.value.forEach((groupId) => {
    const groupProps = layerGroupProperties[groupId]
    if (groupProps) {
      groupProps.forEach((prop) => properties.add(prop))
    }
  })

  // Convert to array, but only include properties that actually exist in the data
  const firstItemProps = Object.keys(featureSelections.items[0]?.props || {})
  return Array.from(properties).filter((prop) => firstItemProps.includes(prop))
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
  // Create a custom CSV export for feature selections
  const headers = ['ID', 'Label', ...relevantProperties.value]

  // Format property names for headers (similar to popup formatting)
  const formattedHeaders = headers.map((header) => {
    if (header === 'ID' || header === 'Label') return header
    return header
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })

  const lines = [
    formattedHeaders.join(','),
    ...featureSelections.items.map((item) =>
      [
        item.id.toString(),
        `Cell ${item.id}`,
        ...relevantProperties.value.map((prop) => item.props[prop] ?? '')
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `selected_cells_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`
  a.click()
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
        ...relevantProperties.map((propKey) => ({
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
          <td v-for="propKey in relevantProperties" :key="propKey">
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
