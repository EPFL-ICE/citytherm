import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
    clearSelections
  }
})
