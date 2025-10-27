<script setup lang="ts">
import { type TimeSeriesPoint, useScenariosStore } from '@/stores/scenarios'
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import ToolSet from '@/components/ToolSet.vue'
import SimulationVariableList from '@/components/SimulationVariableList.vue'
import SimulationResultPlaneHeatmap from '@/components/SimulationResultPlaneHeatmap.vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getSimulationPlaneAvailableTimeSlots,
  getSimulationPlanePresetsForParameters,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import ScenarioSelect from '@/components/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ResultGrid.vue'
import {
  makePathToSliceMerge,
  makePathToTimeSeries,
  type SlicePageParams
} from '@/lib/utils/routingUtils'

const scenarioStore = useScenariosStore()
const route = useRoute()
const router = useRouter()

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const planeSlug = computed(() => route.params.plane as string)
const timeSlug = computed(() => route.params.time as string)
const selectedVariables = computed(() => {
  const vars = route.query.vars as string | undefined
  return vars ? vars.split(',') : []
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
const selectedTimeSeriesPointSlug = ref<string | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(scenarioASlug.value).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const availablePlanes = computed<SimulationPlanePresetsMap>(() => {
  const buildingCanopyHeight = scenarioASlug.value.includes('S1') ? 30 : 16
  const midBuildingZ = scenarioASlug.value.includes('S2') ? 25 : 19

  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ)
})

const planesSelectOptions = computed(() => Object.values(availablePlanes.value))
const availableTimeSlots = computed(() => getSimulationPlaneAvailableTimeSlots())

function goToUpdatedParams(params: Partial<SlicePageParams>) {
  const routePath = makePathToSliceMerge(params, {
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    plane: planeSlug.value,
    time: timeSlug.value,
    variables: selectedVariables.value
  })
  router.push(routePath)
}

const timeSeriesExplorerUrl = computed(() => {
  if (!selectedTimeSeriesPointSlug.value) return null
  return makePathToTimeSeries({
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: selectedTimeSeriesPointSlug.value,
    variables: selectedVariables.value
  })
})

const gridColumns = computed(() => Math.min(2, selectedVariables.value.length))

function navigateToTimeSeriesPoint(pointSlug: string) {
  const routePath = makePathToTimeSeries({
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: pointSlug,
    variables: selectedVariables.value
  })
  router.push(routePath)
}
</script>

<template>
  <two-panes-layout title="Simulation result slice explorer">
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="mb-8">
            <scenario-select
              :model-value="scenarioASlug"
              @update:model-value="goToUpdatedParams({ scenarioA: $event ?? undefined })"
              label="Scenario A"
            />
            <scenario-select
              :model-value="scenarioBSlug"
              @update:model-value="goToUpdatedParams({ scenarioB: $event ?? undefined })"
              label="Scenario B"
              :compare-option="true"
            />
            <v-select
              :model-value="planeSlug"
              :items="planesSelectOptions"
              @update:model-value="goToUpdatedParams({ plane: $event })"
              :item-props="
                (item) => ({ title: item.name, subtitle: item.description, value: item.slug })
              "
              label="Plane"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
            />
            <v-select
              :model-value="timeSlug"
              :items="availableTimeSlots"
              @update:model-value="goToUpdatedParams({ time: $event })"
              :item-props="(item) => ({ title: item.label, value: item.timeSlug })"
              label="Time"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
            />
          </div>
        </template>
        <template #default>
          <div>
            <h3>Available variables</h3>
            <simulation-variable-list
              :model-value="selectedVariables"
              @update:model-value="goToUpdatedParams({ variables: $event })"
            />
          </div>
        </template>
        <template #footer>
          <div>
            <time-series-points-select
              :scenario-slug="scenarioASlug"
              label="Time series point to explore"
              v-model="selectedTimeSeriesPointSlug"
            />
            <v-btn
              color="primary"
              :disabled="!selectedTimeSeriesPointSlug"
              :to="timeSeriesExplorerUrl!"
            >
              Explore point time series
            </v-btn>
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <template v-if="selectedVariables.length > 0">
        <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
          <div
            v-for="(variable, i) in selectedVariables"
            :key="variable"
            :class="{ 'right-border': i % gridColumns < gridColumns - 1 }"
          >
            <simulation-result-plane-heatmap
              :plane-slug="planeSlug"
              :variable-slug="variable"
              :time-slice-slug="timeSlug"
              :scenario-a-slug="scenarioASlug"
              :scenario-b-slug="scenarioBSlug"
              @point-clicked="(point) => navigateToTimeSeriesPoint(point)"
            />
          </div>
        </result-grid>
      </template>
      <template v-else>
        <div class="d-flex h-100 align-center justify-center">
          <div class="text-h4">Please select a variable on the left panel</div>
        </div>
      </template>
    </template>
  </two-panes-layout>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
