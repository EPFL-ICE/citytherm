<script setup lang="ts">
import { type TimeSeriesPoint, useScenariosStore } from '@/stores/simulation/scenarios'
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import { computed, ref, watchEffect } from 'vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import SimulationVariableList from '@/components/simulation/pickers/SimulationVariableList.vue'
import SimulationResultPlaneHeatmap from '@/components/simulation/heatmap/SimulationResultPlaneHeatmap.vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getSimulationPlaneAvailableTimeSlots,
  getSimulationPresetsForScenarioSlug,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import ScenarioSelect from '@/components/simulation/pickers/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/simulation/pickers/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import HeatmapSettings from '@/components/simulation/heatmap/HeatmapSettings.vue'
import {
  makePathToPlaneComparatorMerge,
  makePathToPlaneExplorer,
  makePathToTimeSeriesComparator,
  type PlaneComparatorPageParams
} from '@/lib/utils/routingUtils'
import { mdiChevronLeft } from '@mdi/js'

const scenarioStore = useScenariosStore()
const route = useRoute()
const router = useRouter()

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const planeSlug = computed(() => route.params.plane as SimulationPlanePreset)
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

const availablePlanes = computed<SimulationPlanePresetsMap>(() =>
  getSimulationPresetsForScenarioSlug(scenarioASlug.value)
)

const planesSelectOptions = computed(() => Object.values(availablePlanes.value))
const availableTimeSlots = computed(() => getSimulationPlaneAvailableTimeSlots())

function goToUpdatedParams(params: Partial<PlaneComparatorPageParams>) {
  const routePath = makePathToPlaneComparatorMerge(params, {
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    plane: planeSlug.value,
    time: timeSlug.value,
    variables: selectedVariables.value
  })
  router.push(routePath)
}

const explorerUrl = computed(() => {
  if (selectedVariables.value.length < 1) return null
  return makePathToPlaneExplorer({
    plane: planeSlug.value,
    time: timeSlug.value,
    scenarios: scenarioBSlug.value
      ? [scenarioASlug.value, scenarioBSlug.value]
      : [scenarioASlug.value],
    variable: selectedVariables.value[0]
  })
})

const timeSeriesExplorerUrl = computed(() => {
  if (!selectedTimeSeriesPointSlug.value) return null
  return makePathToTimeSeriesComparator({
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: selectedTimeSeriesPointSlug.value,
    variables: selectedVariables.value
  })
})

const gridColumns = computed(() => Math.min(3, selectedVariables.value.length))

function navigateToTimeSeriesPoint(pointSlug: string) {
  const routePath = makePathToTimeSeriesComparator({
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: pointSlug,
    variables: selectedVariables.value
  })
  router.push(routePath)
}
</script>

<template>
  <two-panes-layout title="Plane Data Comparator" :disable-left-pane-padding="true">
    <template #subtitle>
      <v-btn
        :to="explorerUrl!"
        :disabled="!explorerUrl"
        :prepend-icon="mdiChevronLeft"
        color="primary"
        density="comfortable"
      >
        Back to Explorer
      </v-btn>
    </template>
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="pa-4">
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
          <simulation-variable-list
            :model-value="selectedVariables"
            :rename-wall-and-facade-to-roof="planeSlug === 'horizontal_building_canopy'"
            @update:model-value="goToUpdatedParams({ variables: $event })"
          />
        </template>
        <template #footer>
          <div class="pa-4">
            <time-series-points-select
              :scenario-slug="scenarioASlug"
              label="Time series point to explore"
              v-model="selectedTimeSeriesPointSlug"
            />
            <v-btn
              color="primary"
              width="100%"
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
            :class="[{ 'right-border': i % gridColumns < gridColumns - 1 }, 'pa-4']"
          >
            <heatmap-settings
              :variable-slug="variable"
              :scenario-a-slug="scenarioASlug"
              :scenario-b-slug="scenarioBSlug"
              :force-mode="'difference'"
              :force-flip="true"
            >
              <template
                #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }"
              >
                <simulation-result-plane-heatmap
                  :plane-slug="planeSlug"
                  :variable-slug="variable"
                  :time-slice-slug="timeSlug"
                  :scenario-a-slug="scenarioASlug"
                  :scenario-b-slug="scenarioBSlug"
                  :expected-value-range="expectedValueRange"
                  :infer-min-max="inferMinMax"
                  :mode="mode"
                  :show-special-points="showSpecialPoints"
                  :flip-x="flipX"
                  :small="true"
                  @point-clicked="(point) => navigateToTimeSeriesPoint(point)"
                />
              </template>
            </heatmap-settings>
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
