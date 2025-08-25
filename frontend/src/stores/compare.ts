import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export interface TableRow {
  uid: string
  label?: string
  values: Record<string, number | string | null>
}

export const useCompareStore = defineStore('compare', () => {
  const selectedLayerIds = ref<string[]>([])
  const selectedNeighborhoodIds = ref<string[]>([])
  const layerLimit = ref(6) // feature flag -> 6
  const neighborhoodLimit = ref(6)
  const tableData = ref<TableRow[]>([])
  const viewport = ref<any>(null)

  const canSelectMoreLayers = computed(() => selectedLayerIds.value.length < layerLimit.value)
  const canSelectMoreNeighborhoods = computed(
    () => selectedNeighborhoodIds.value.length < neighborhoodLimit.value
  )

  function toggleLayer(id: string) {
    const index = selectedLayerIds.value.indexOf(id)
    if (index > -1) {
      // Remove layer
      selectedLayerIds.value.splice(index, 1)
    } else if (canSelectMoreLayers.value) {
      // Add layer if under limit
      selectedLayerIds.value.push(id)
    }
    // Update table data when layers change
    updateTableData()
  }

  function toggleNeighborhood(uid: string) {
    const index = selectedNeighborhoodIds.value.indexOf(uid)
    if (index > -1) {
      // Remove neighborhood
      selectedNeighborhoodIds.value.splice(index, 1)
    } else if (canSelectMoreNeighborhoods.value) {
      // Add neighborhood if under limit
      selectedNeighborhoodIds.value.push(uid)
    }
    // Update table data when neighborhoods change
    updateTableData()
  }

  function setViewport(v: any) {
    viewport.value = v
  }

  function setTableData(rows: TableRow[]) {
    tableData.value = rows
  }

  function clearSelections() {
    selectedNeighborhoodIds.value = []
  }

  // Function to update table data based on selected layers and neighborhoods
  function updateTableData() {
    // Create table rows for each selected neighborhood
    const rows: TableRow[] = selectedNeighborhoodIds.value.map((uid) => ({
      uid,
      label: `Neighborhood ${uid}`, // In a real implementation, this would come from the feature properties
      values: {}
    }))

    // For each selected layer, add placeholder values
    // In a real implementation, this would fetch actual data from the map features
    selectedLayerIds.value.forEach((layerId) => {
      rows.forEach((row) => {
        // Placeholder values - in a real implementation, these would come from querying the map features
        row.values[layerId] = Math.random() * 100 // Random placeholder value
      })
    })

    // Set the table data
    tableData.value = rows
  }

  // Watch for changes in selected layers and neighborhoods to update table data
  watch(
    [selectedLayerIds, selectedNeighborhoodIds],
    () => {
      updateTableData()
    },
    { deep: true }
  )

  return {
    selectedLayerIds,
    selectedNeighborhoodIds,
    layerLimit,
    neighborhoodLimit,
    tableData,
    viewport,
    canSelectMoreLayers,
    canSelectMoreNeighborhoods,
    toggleLayer,
    toggleNeighborhood,
    setViewport,
    setTableData,
    clearSelections,
    updateTableData
  }
})
