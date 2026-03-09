<script setup lang="ts">
import SimulationVariableRadioList from '../pickers/SimulationVariableRadioList.vue'
import SimulationVariableList from '../pickers/SimulationVariableList.vue'
import SimulationVariableCategoryList from '../pickers/SimulationVariableCategoryList.vue'
import type { GraphDesign } from '@/stores/simulation/graphs'
import { computed, ref, watch } from 'vue'
import {
  getPlaneAvailableHeightLevels,
  getSimulationPlaneAvailableTimeSlots
} from '@/lib/simulation/simulationResultPlanesUtils'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'

const props = defineProps<{
  graph: GraphDesign
}>()

const scenarioStore = useScenariosStore()

const varsKind = computed<'single' | 'multiple' | 'categories'>(() => {
  if (props.graph.graphKindSlug === 'heatmap-scenarios') {
    return 'single'
  }
  if (props.graph.graphKindSlug === 'temporal-explore-categories') {
    return 'categories'
  }

  return 'multiple'
})

const point = ref<TimeSeriesPoint | null>(null)
watch(
  [() => props.graph.scenarios, () => props.graph.point],
  async () => {
    if (!props.graph.point || props.graph.scenarios.length === 0) {
      point.value = null
      return
    }

    point.value = await scenarioStore.getFullTimeSeriesPointFromSlug(
      props.graph.point!,
      props.graph.scenarios[0]
    )
  },
  { immediate: true }
)
const pointHeight = computed(() => {
  if (point.value) {
    return point.value.c[2]
  }
  return undefined
})

const renameWallAndFacadeToRoof = computed(() => {
  if (props.graph.plane) return props.graph.plane === 'horizontal_building_canopy'
  return pointHeight.value !== undefined && pointHeight.value > 16
})
const availableAt = computed(() => {
  if (props.graph.plane) return getPlaneAvailableHeightLevels(props.graph.plane)
  return pointHeight.value
})

const shouldDisplayTime = computed(() => {
  return props.graph.plane !== null
})
const availableTimeSlots = computed(() => getSimulationPlaneAvailableTimeSlots())
</script>

<template>
  <div v-if="shouldDisplayTime" class="pa-4">
    <div class="text-subtitle-1 font-weight-medium">Time</div>
    <v-select
      v-model="props.graph.time"
      :items="availableTimeSlots"
      :item-props="(item) => ({ title: item.label, value: item.timeSlug })"
      label="Time"
      single-line
      :hide-details="true"
      density="comfortable"
      class="mb-2"
    />
  </div>
  <div>
    <simulation-variable-radio-list
      v-if="varsKind === 'single' && props.graph.plane !== null"
      v-model="props.graph.variables[0]"
      :rename-wall-and-facade-to-roof="renameWallAndFacadeToRoof"
      :available-at="availableAt"
      :omit-groups="['surface_level', 'building_data']"
    />
    <!-- variables store categories for now -->
    <simulation-variable-category-list
      v-else-if="varsKind === 'categories' && props.graph.point !== null"
      v-model="props.graph.variables"
      :omit-categories="['sw_radiation']"
      :available-at="pointHeight"
      :rename-wall-and-facade-to-roof="(pointHeight ?? 0) >= 16"
    />
    <simulation-variable-list
      v-else
      v-model="props.graph.variables"
      :rename-wall-and-facade-to-roof="renameWallAndFacadeToRoof"
      :available-at="availableAt"
      :omit-groups="['surface_level', 'building_data']"
    />
  </div>
</template>
