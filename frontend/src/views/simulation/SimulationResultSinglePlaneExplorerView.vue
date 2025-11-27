<script setup lang="ts">
import {
  type ScenarioCollection,
  type TimeSeriesPoint,
  useScenariosStore
} from '@/stores/simulation/scenarios'
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import { computed, onMounted, ref, watchEffect } from 'vue'
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
import TimeSeriesPointsSelect from '@/components/simulation/pickers/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import HeatmapSettings from '@/components/simulation/heatmap/HeatmapSettings.vue'
import ScenarioSelect from '@/components/simulation/pickers/ScenarioSelect.vue'
import {
  makePathToPlaneComparator,
  makePathToPlaneExplorerMerge,
  makePathToScenarioPicker,
  type PlaneExplorerPageParams,
  makePathToTimeSeriesExplorer,
  makePathToPlaneSingleExplorerMerge,
  type PlaneSingleExplorerPageParams,
  makePathToPlaneExplorer
} from '@/lib/utils/routingUtils'
import { mdiChevronLeft } from '@mdi/js'
import { useSimulationResultPlaneStore } from '@/stores/simulation/simulationResultPlane'

const scenarioStore = useScenariosStore()
const route = useRoute()
const router = useRouter()

const planeSlug = computed(() => route.params.plane as SimulationPlanePreset)
const timeSlug = computed(() => route.params.time as string)
const scenarioSlug = computed(() => route.params.scenario as string)
const selectedVariables = computed(() => {
  const variables = route.query.vars as string | undefined
  return variables ? variables.split(',') : []
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

const gridColumns = computed(() => Math.min(3, selectedVariables.value.length))

const pickedScenarios = ref<string[]>([])

const timeSeriesExplorerUrl = computed(() => {
  if (!selectedTimeSeriesPointSlug.value) return null
  return makePathToTimeSeriesExplorer({
    scenarios: [scenarioSlug.value],
    point: selectedTimeSeriesPointSlug.value,
    variables: selectedVariables.value
  })
})

function navigateToTimeSeriesPoint(pointSlug: string) {
  const routePath = makePathToTimeSeriesExplorer({
    scenarios: [scenarioSlug.value],
    point: pointSlug,
    variables: selectedVariables.value
  })
  router.push(routePath)
}

const pickerUrl = computed(() => {
  return makePathToScenarioPicker({
    scenario: scenarioSlug.value,
    plane: planeSlug.value
  })
})

const comparatorUrl = computed(() => {
  if (pickedScenarios.value.length !== 2) return ''

  return makePathToPlaneComparator({
    plane: planeSlug.value,
    time: timeSlug.value,
    variables: selectedVariables.value,
    scenarioA: pickedScenarios.value[0],
    scenarioB: pickedScenarios.value[1]
  })
})

function goToUpdatedParams(params: Partial<PlaneSingleExplorerPageParams>) {
  const routePath = makePathToPlaneSingleExplorerMerge(params, {
    plane: planeSlug.value,
    time: timeSlug.value,
    variables: selectedVariables.value,
    scenario: scenarioSlug.value
  })
  router.push(routePath)
}

function scenarioTitle(slug: string) {
  const scenario = allScenarios.value?.scenarios[slug]
  return `${scenario?.id} - ${scenario?.name}`
}

watchEffect(() => {
  console.log(selectedVariables.value)
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
            <scenario-select
              label="Scenario"
              :model-value="scenarioSlug"
              @update:model-value="goToUpdatedParams({ scenario: $event ?? undefined })"
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
      <div v-if="scenarioSlug" class="pa-4">
        <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
          <div
            v-for="(variable, i) in selectedVariables"
            :key="variable"
            :class="{
              'right-border': i % gridColumns < gridColumns - 1,
              grayed: pickedScenarios.length > 0 && !pickedScenarios.includes(variable),
              'scenario-wrapper': true
            }"
          >
            <heatmap-settings
              :variable-slug="variable"
              :hide-individual-min-max="false"
              :force-flip="true"
            >
              <template #right-toolbar>
                <v-btn
                  :to="
                    makePathToPlaneExplorer({
                      plane: planeSlug,
                      time: timeSlug,
                      variable,
                      scenarios: [scenarioSlug]
                    })
                  "
                  color="primary"
                >
                  Compare this variable across scenarios
                </v-btn>
              </template>
              <template
                #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }"
              >
                <simulation-result-plane-heatmap
                  :plane-slug="planeSlug"
                  :variable-slug="variable"
                  :time-slice-slug="timeSlug"
                  :scenario-a-slug="scenarioSlug"
                  :expected-value-range="expectedValueRange"
                  :infer-min-max="inferMinMax"
                  :flip-x="flipX"
                  :mode="mode"
                  :show-special-points="showSpecialPoints"
                  :small="true"
                  @point-clicked="(point) => navigateToTimeSeriesPoint(point)"
                />
              </template>
            </heatmap-settings>
          </div>
        </result-grid>
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
