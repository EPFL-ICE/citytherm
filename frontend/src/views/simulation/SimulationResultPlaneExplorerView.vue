<script setup lang="ts">
import {
  type ScenarioCollection,
  type TimeSeriesPoint,
  useScenariosStore
} from '@/stores/simulation/scenarios'
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import SimulationVariableRadioList from '@/components/simulation/pickers/SimulationVariableRadioList.vue'
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
import ScenarioMultiSelect from '@/components/simulation/pickers/ScenarioMultiSelect.vue'
import {
  makePathToPlaneComparator,
  makePathToPlaneExplorer,
  makePathToPlaneExplorerMerge,
  makePathToPlaneComparatorMerge,
  makePathToScenarioPicker,
  makePathToTimeSeriesComparator,
  type PlaneExplorerPageParams,
  makePathToTimeSeriesExplorer
} from '@/lib/utils/routingUtils'
import { mdiChevronLeft } from '@mdi/js'
import { useSimulationResultPlaneStore } from '@/stores/simulation/simulationResultPlane'

const scenarioStore = useScenariosStore()
const simulationResultStore = useSimulationResultPlaneStore()
const route = useRoute()
const router = useRouter()

/* const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)*/
const planeSlug = computed(() => route.params.plane as SimulationPlanePreset)
const timeSlug = computed(() => route.params.time as string)
const variableSlug = computed(() => route.params.variable as string)
const selectedScenarios = computed(() => {
  const scenarios = route.query.scenarios as string | undefined
  return scenarios ? scenarios.split(',') : []
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
const selectedTimeSeriesPointSlug = ref<string | null>(null)
watchEffect(() => {
  scenarioStore.getDefaultTimeSeriesPoints().then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const allScenarios = ref<ScenarioCollection | null>(null)
onMounted(async () => {
  allScenarios.value = await scenarioStore.getScenarioDescriptions()
})

const availablePlanes = computed<SimulationPlanePresetsMap>(() =>
  getSimulationPresetsForScenarioSlug()
)

const planesSelectOptions = computed(() => Object.values(availablePlanes.value))
const availableTimeSlots = computed(() => getSimulationPlaneAvailableTimeSlots())

const gridColumns = computed(() => Math.min(2, selectedScenarios.value.length))

const pickedScenarios = ref<string[]>([])

const timeSeriesExplorerUrl = computed(() => {
  if (!selectedTimeSeriesPointSlug.value) return null
  return makePathToTimeSeriesExplorer({
    scenarios: selectedScenarios.value,
    point: selectedTimeSeriesPointSlug.value,
    variables: [variableSlug.value]
  })
})

function navigateToTimeSeriesPoint(pointSlug: string) {
  const routePath = makePathToTimeSeriesExplorer({
    scenarios: selectedScenarios.value,
    point: pointSlug,
    variables: [variableSlug.value]
  })
  router.push(routePath)
}

const pickerUrl = computed(() => {
  return makePathToScenarioPicker({
    scenario: selectedScenarios.value[0] ?? null,
    plane: planeSlug.value
  })
})

const comparatorUrl = computed(() => {
  if (pickedScenarios.value.length !== 2) return ''

  return makePathToPlaneComparator({
    plane: planeSlug.value,
    time: timeSlug.value,
    variables: [variableSlug.value],
    scenarioA: pickedScenarios.value[0],
    scenarioB: pickedScenarios.value[1]
  })
})

function goToUpdatedParams(params: Partial<PlaneExplorerPageParams>) {
  const routePath = makePathToPlaneExplorerMerge(params, {
    plane: planeSlug.value,
    time: timeSlug.value,
    variable: variableSlug.value,
    scenarios: selectedScenarios.value
  })
  router.push(routePath)
}

function scenarioTitle(slug: string) {
  const scenario = allScenarios.value?.scenarios[slug]
  return `${scenario?.id} - ${scenario?.name}`
}

type ValueRangeOption = 'infer-individual' | 'infer-global' | 'fixed'
const rangeOption = ref<ValueRangeOption>('infer-global')

const rangeSelectOptions: { title: string; value: ValueRangeOption }[] = [
  { title: 'Min/max per scenario', value: 'infer-individual' },
  { title: 'Min/max across all scenarios', value: 'infer-global' },
  { title: 'Min/max range predefined', value: 'fixed' }
]

const globalMinMax = ref<{ min: number; max: number } | null>(null)
watchEffect(() => {
  globalMinMax.value = null
  if (rangeOption.value !== 'infer-global') {
    return
  }

  simulationResultStore
    .getMinMaxForMultipleScenariosSlugs(
      selectedScenarios.value,
      planeSlug.value,
      timeSlug.value,
      variableSlug.value
    )
    .then((minMax) => {
      globalMinMax.value = minMax
    })
})
</script>

<template>
  <two-panes-layout title="Plane Data Explorer" :disable-left-pane-padding="true">
    <template #subtitle>
      <v-btn :to="pickerUrl" :prepend-icon="mdiChevronLeft" color="primary" density="comfortable">
        Back to Scenarios
      </v-btn>
    </template>
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="pa-4">
            <scenario-multi-select
              label="Scenarios"
              :force-checked="['S0']"
              :model-value="selectedScenarios"
              @update:model-value="goToUpdatedParams({ scenarios: $event })"
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
            <v-select
              :model-value="rangeOption"
              :items="rangeSelectOptions"
              @update:model-value="rangeOption = $event"
              label="Value range mode"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
            />
          </div>
        </template>
        <template #default>
          <simulation-variable-radio-list
            :model-value="variableSlug"
            :rename-wall-and-facade-to-roof="planeSlug === 'horizontal_building_canopy'"
            @update:model-value="goToUpdatedParams({ variable: $event })"
          />
        </template>
        <template #footer>
          <div class="pa-4">
            <time-series-points-select
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
      <div v-if="selectedScenarios.length > 0" class="pa-4">
        <heatmap-settings
          :variable-slug="variableSlug"
          :hide-individual-min-max="rangeOption !== 'infer-individual'"
          :force-flip="true"
        >
          <template #right-toolbar>
            <v-btn :to="comparatorUrl" :disabled="!comparatorUrl" color="primary">
              Compare scenarios ({{ pickedScenarios.length }}/2)
            </v-btn>
          </template>
          <template #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }">
            <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
              <div
                v-for="(scenario, i) in selectedScenarios"
                :key="scenario"
                :class="{
                  'right-border': i % gridColumns < gridColumns - 1,
                  grayed: pickedScenarios.length > 0 && !pickedScenarios.includes(scenario),
                  'scenario-wrapper': true
                }"
              >
                <h3 class="px-4 py-2 d-flex align-center">
                  <v-checkbox
                    v-model="pickedScenarios"
                    density="comfortable"
                    hide-details
                    :value="scenario"
                  />
                  <span class="ml-1">{{ scenarioTitle(scenario) }}</span>
                </h3>
                <simulation-result-plane-heatmap
                  :plane-slug="planeSlug"
                  :variable-slug="variableSlug"
                  :time-slice-slug="timeSlug"
                  :scenario-a-slug="scenario"
                  :expected-value-range="expectedValueRange"
                  :infer-min-max="inferMinMax && rangeOption === 'infer-individual'"
                  :force-min-max="globalMinMax"
                  :flip-x="flipX"
                  :mode="mode"
                  :show-special-points="showSpecialPoints"
                  :small="true"
                  @point-clicked="(point) => navigateToTimeSeriesPoint(point)"
                />
              </div>
            </result-grid>
          </template>
        </heatmap-settings>
      </div>
      <div v-else class="d-flex h-100 align-center justify-center">
        <div class="text-h4">No scenarios picked</div>
      </div>
    </template>
  </two-panes-layout>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.scenario-wrapper {
  transition: 0.25s;
}

.grayed {
  opacity: 0.5;
}
</style>
