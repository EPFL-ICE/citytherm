import { getLayerGroups, getMapConfig } from '@/config/mapConfig'
import { useCityStore } from '@/stores/city'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
// import { useCompareStore } from './compare'
import { useFeatureSelections } from './useFeatureSelections'

export const useLayersStore = defineStore('layers', () => {
  const cityStore = useCityStore()

  // Store the layer groups from config, reactively based on current city
  const layerGroups = computed(() => getLayerGroups(cityStore.city))

  // Selected layer IDs
  const selectedLayers = ref<string[]>(['baselayer'])

  // Store the filtered categories for each layer
  const filteredCategories = ref<Record<string, Record<string, string[]>>>({})

  function filterOutCategories(layerId: string, variable: string, categories: string[]) {
    filteredCategories.value[layerId][variable] = categories
  }

  // Expanded state for each group - use a watch to update when city changes
  const expandedGroups = ref<Record<string, boolean>>({})

  // Initialize expanded groups when layerGroups changes
  watch(
    layerGroups,
    (newGroups) => {
      expandedGroups.value = Object.fromEntries(
        newGroups.map((group) => [group.id, !!group.expanded])
      )
    },
    { immediate: true }
  )


    // maybe not needed since we're using v-model with checkboxes
  // need watch on selectedLayers if needed or computed ?
  watch(selectedLayers, (newSelection) => { 
    console.log('Selected layers updated:', newSelection)
    if (newSelection.length === 0) {
      // clean up filtered categories if no layers are selected
      // filteredCategories.value = {}
      // alternatively, clear only categories related to unselected layers
      Object.keys(filteredCategories.value).forEach((layerId) => {
        if (!newSelection.includes(layerId)) {
          delete filteredCategories.value[layerId]
        }
      })
      // clean up table selections if no layers are selected
      // const compareStore = useCompareStore()
      // compareStore.clearSelections()
      const featureSelections = useFeatureSelections()
      featureSelections.clear();
      
    }
  })
  // Update selected layers (for checkboxes/multiple selection)
  // Flatten all layers for internal use
  const possibleLayers = computed(() => {
    return layerGroups.value.flatMap((group) =>
      group.layers.map((layer) => ({
        id: layer.layer.id, // Extract the layer ID correctly
        label: layer.label,
        info: layer.info,
        attribution: (layer.source as any).attribution,
        groupId: group.id
      }))
    )
  })

  // Get visible layer configurations
  const visibleLayers = computed(() => {
    const mapConfig = getMapConfig(cityStore.city)
    return mapConfig.layers.filter((layer) => selectedLayers.value.includes(layer.layer.id))
  })

  // Toggle group expansion
  function toggleGroup(groupId: string) {
    expandedGroups.value[groupId] = !expandedGroups.value[groupId]
    const group = layerGroups.value.find((group) => group.id === groupId)
    if (group) group.expanded = expandedGroups.value[groupId]
  }

  // Check if any layer in a group is selected
  function isGroupVisible(groupId: string): boolean {
    return selectedLayers.value.some((id) => {
      const layer = possibleLayers.value.find((l) => l.id === id)
      return layer && layer.groupId === groupId
    })
  }

  // Toggle visibility of all layers in a group
  function toggleGroupVisibility(groupId: string) {
    // Check if any layer from this group is currently selected
    const isVisible = isGroupVisible(groupId)

    // Create arrays needed for both branches
    const groupLayers = possibleLayers.value.filter((layer) => layer.groupId === groupId)
    const groupLayerIds = groupLayers.map((layer) => layer.id)

    if (isVisible) {
      // If visible, remove all layers from this group
      selectedLayers.value = selectedLayers.value.filter((id) => !groupLayerIds.includes(id))
    } else {
      // If not visible, add layers according to group's selection mode
      const group = layerGroups.value.find((g) => g.id === groupId)
      if (group?.multiple) {
        // For multiple selection groups, add all layers
        selectedLayers.value = [...selectedLayers.value, ...groupLayerIds]
      } else if (groupLayers.length > 0) {
        // For single selection groups, add only the first layer
        const otherGroupLayers = selectedLayers.value.filter((id) => {
          const layer = possibleLayers.value.find((l) => l.id === id)
          return layer && layer.groupId !== groupId
        })
        selectedLayers.value = [...otherGroupLayers, groupLayerIds[0]]
      }
    }
  }


  function updateSelectedLayers(newSelection: string[] | null) {
    if (newSelection !== null) {
      selectedLayers.value = [...newSelection] // Use spread to ensure reactivity
    } else {
      selectedLayers.value = []
    }
  }

  // Update single layer selection (for radio buttons/single selection)
  function updateSingleLayerSelection(groupId: string, layerId: string) {
    // Create a new array without any layers from this group
    const otherGroupLayers = selectedLayers.value.filter((id) => {
      const layer = possibleLayers.value.find((l) => l.id === id)
      return layer && layer.groupId !== groupId
    })

    // Add the selected layer and update the array
    updateSelectedLayers([...otherGroupLayers, layerId])
  }

  return {
    layerGroups,
    selectedLayers,
    filteredCategories,
    expandedGroups,
    possibleLayers,
    visibleLayers,
    toggleGroup,
    isGroupVisible,
    filterOutCategories,
    toggleGroupVisibility,
    updateSelectedLayers,
    updateSingleLayerSelection
  }
})
