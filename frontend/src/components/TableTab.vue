<script setup lang="ts">
import { computed } from 'vue'
import { useCompareStore } from '@/stores/compare'
import { useFeatureSelections } from '@/stores/useFeatureSelections'
import { useCityStore } from '@/stores/city'
import { mdiClose, mdiDownload } from '@mdi/js'

const compareStore = useCompareStore()
const featureSelections = useFeatureSelections()

// Define fixed list of properties to display with separate label and unit
const tableProperties = [
  { key: 'city', label: 'City', unit: '' },
  { key: 'id', label: 'Cell ID', unit: '' },
  { key: 'LCZ', label: 'LCZ', unit: '' },
  { key: 'description', label: 'Description', unit: '' },
  { key: 'Building height', label: 'Building height', unit: 'm' },
  { key: 'Height varability', label: 'Height variability', unit: 'm' },
  { key: 'Sky view factor', label: 'Sky view factor', unit: '-' },
  { key: 'Frontal area index', label: 'Frontal area index', unit: '-' },
  { key: 'Aspect ratio', label: 'Aspect ratio', unit: '-' },
  { key: 'Building cover fraction', label: 'Building cover fraction', unit: '-' },
  {
    key: 'Impervious surface cover fraction',
    label: 'Impervious surface cover fraction',
    unit: '-'
  },
  { key: 'Pervious surface cover fraction', label: 'Pervious surface cover fraction', unit: '-' },
  { key: 'Water cover fraction', label: 'Water cover fraction', unit: '-' },
  { key: 'Intersections', label: 'Road intersections', unit: '-' },
  { key: 'Length primary road', label: 'Length primary roads', unit: 'm' },
  { key: 'Length secondary road', label: 'Length secondary roads', unit: 'm' },
  { key: 'Length highway', label: 'Length highway', unit: 'm' },
  { key: 'Irradiance_S', label: 'Irradiation summer', unit: 'kWh/m^2' },
  { key: 'Irradiance_W', label: 'Irradiation winter', unit: 'kWh/m^2' },
  { key: 'LST_mean', label: 'LST', unit: '°C' },
]

// Computed property to generate combined labels (label + unit)
const combinedLabels = computed(() =>
  tableProperties.map((prop) =>
    prop.unit && prop.unit !== '' ? `${prop.label} (${prop.unit})` : prop.label
  )
)

// Check if we have data to display
const hasData = computed(() => {
  return featureSelections.items.length > 0
})

// Check if we have no selections
const isEmpty = computed(() => {
  return featureSelections.items.length === 0
})

function exportCSV() {
  // Get current city name
  const cityStore = useCityStore()
  const cityName = cityStore.current.label

  // Create headers using the combined labels
  const headers = ['Index', ...combinedLabels.value]

  // Create data rows
  const rows = featureSelections.items.map((item) => {
    // For each property, get the corresponding value from item.props
    const values = tableProperties.map((prop) => {
      // Special handling for city and id
      if (prop.key === 'city') return cityName
      if (prop.key === 'id') return item.id

      // For other properties, get from item.props
      return item.props[prop.key] ?? ''
    })

    // Return the row with index and all property values
    return [item.index.toString(), ...values]
  })

  // Join headers and rows with commas for CSV format
  const lines = [headers.join(','), ...rows.map((row) => row.join(','))]

  // Create CSV blob
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)

  // Format date and time
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-')

  a.download = `citytherm_${cityName.toLowerCase().replace(/\s+/g, '_')}_${date}_${time}.csv`
  a.click()
}

// Function to clear all neighborhoods from both stores
function clearAllNeighborhoods() {
  // Clear feature selections store
  featureSelections.clear()
  // Clear compare store
  compareStore.clearSelections()

  // The map will automatically update due to the watcher on featureSelections.featureCollection
}

// Convert featureSelections.items to the format expected by the table
const tableData = computed(() => {
  return featureSelections.items.map((item) => ({
    uid: item.id.toString(),
    index: item.index,
    label: `Cell ${item.index}`,
    values: item.props
  }))
})
</script>

<template>
  <div class="table-tab fill-height d-flex flex-column">
    <div
      class="controls d-flex justify-end"
      :class="{ 'pa-2': hasData, 'pa-4 empty-state': isEmpty, 'ga-1': hasData }"
    >
      <v-btn
        v-if="hasData"
        color="error"
        :prepend-icon="mdiClose"
        density="compact"
        @click="clearAllNeighborhoods"
      >
        Clear All
      </v-btn>
      <v-btn
        v-if="hasData"
        density="compact"
        color="primary"
        :prepend-icon="mdiDownload"
        @click="exportCSV"
      >
        Download Table
      </v-btn>
    </div>

    <v-data-table
      v-if="hasData"
      :headers="[
        { title: 'Index', key: 'index' },
        ...tableProperties.map((prop, index) => ({
          title: combinedLabels[index],
          key: `values.${prop.key}`
        }))
      ]"
      :items="tableData"
      :hide-default-footer="true"
      class="flex-grow-1"
      density="compact"
    >
      <template #item="{ item }">
        <tr>
          <td>{{ item.index }}</td>
          <td v-for="prop in tableProperties" :key="prop.key">
            <span
              v-if="prop.key === 'color'"
              :style="{
                backgroundColor: item.values[prop.key],
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                marginLeft: '8px'
              }"
            ></span>
            <span v-else-if="prop.key === 'city'">
              {{ useCityStore().current.label }}
            </span>
            <span v-else>
              {{ item.values[prop.key] || '-' }}
            </span>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.table-tab {
  height: 100%;
  padding-bottom: 1rem;
}

.controls {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.empty-state {
  background-color: #f5f5f5;
}

.neighborhood-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.neighborhood-section h3 {
  margin-bottom: 8px;
}

.neighborhood-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
