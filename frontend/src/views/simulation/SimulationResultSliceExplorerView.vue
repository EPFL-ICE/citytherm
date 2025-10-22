<script setup lang="ts">
import {
  type TimeSeriesPoint,
  useScenariosStore,
  type ScenarioDescription
} from '@/stores/scenarios'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import { computed, onMounted, ref, shallowRef, watchEffect } from 'vue'
import ToolSet from '@/components/ToolSet.vue'
import SimulationVariableList from '@/components/SimulationVariableList.vue'
import SimulationResultPlaneHeatmap from '@/components/SimulationResultPlaneHeatmap.vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getSimulationPlaneAvailableTimeSlots,
  getSimulationPlanePresetsForParameters,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import { makePointSlugArray } from '@/stores/simulationResultTimeSeries'

const scenarioStore = useScenariosStore()
const route = useRoute()
const router = useRouter()

interface PageParams {
  scenarioA: string
  scenarioB: string | '_'
  plane: string
  time: string
}

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const planeSlug = computed(() => route.params.plane as string)
const timeSlug = computed(() => route.params.time as string)

const scenariosList = ref<ScenarioDescription[] | null>(null)
onMounted(async () => {
  scenariosList.value = await scenarioStore.getScenarioDescriptions()
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
const selectedTimeSeriesPointSlug = ref<string | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(scenarioASlug.value).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const selectedVariables = shallowRef<string[]>([])

const availablePlanes = computed<SimulationPlanePresetsMap>(() => {
  const buildingCanopyHeight = scenarioASlug.value.includes('S1') ? 30 : 16
  const midBuildingZ = scenarioASlug.value.includes('S2') ? 25 : 19

  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ)
})

const planesSelectOptions = computed(() => Object.values(availablePlanes.value))
const availableTimeSlots = computed(() => getSimulationPlaneAvailableTimeSlots())

function goToUpdatedParams(params: Partial<PageParams>) {
  const newParams: PageParams = {
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value || '_',
    plane: planeSlug.value,
    time: timeSlug.value,
    ...params
  }

  const routePath = `/simulation/plane/${newParams.scenarioA}/${newParams.scenarioB}/${newParams.plane}/${newParams.time}`
  router.push(routePath)
}

function scenarioItemProps(item: ScenarioDescription | null) {
  if (!item) return { title: 'No comparison', subtitle: 'Pick a scenario to compare', value: null }
  return { title: `${item.id} - ${item.scenario}`, subtitle: item.description, value: item.slug }
}

const timeSeriesExplorerUrl = computed(() => {
  if (!selectedTimeSeriesPointSlug) return null
  return `/simulation/timeSeries/${scenarioASlug.value}/${scenarioBSlug.value ?? '_'}/${selectedTimeSeriesPointSlug.value}`
})
</script>

<template>
  <two-panes-layout title="Simulation result slice explorer">
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="mb-8">
            <v-select
              :model-value="scenarioASlug"
              :items="scenariosList ?? []"
              :item-props="scenarioItemProps"
              @update:model-value="goToUpdatedParams({ scenarioA: $event })"
              label="Scenario A"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
            />
            <v-select
              :model-value="scenarioBSlug"
              :items="scenariosList ? [null, ...scenariosList] : []"
              :item-props="scenarioItemProps"
              @update:model-value="goToUpdatedParams({ scenarioB: $event })"
              label="Scenario B"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
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
            <simulation-variable-list v-model="selectedVariables" />
          </div>
        </template>
        <template #footer>
          <div>
            <v-select
              v-if="timeSeriesPointsList"
              v-model="selectedTimeSeriesPointSlug"
              :items="timeSeriesPointsList"
              :item-props="
                (item) => ({
                  title: `x: ${item.c[0]} ; y: ${item.c[1]} ; z: ${item.c[2]}`,
                  subtitle: availablePlanes[item.p as SimulationPlanePreset].name,
                  value: makePointSlugArray(item.c)
                })
              "
              label="Time series point"
              single-line
              :hide-details="true"
              density="comfortable"
              class="mb-2"
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
      <div v-for="variable in selectedVariables" :key="variable">
        <simulation-result-plane-heatmap
          :plane-slug="planeSlug"
          :variable-slug="variable"
          :time-slice-slug="timeSlug"
          :scenario-a-slug="scenarioASlug"
          :scenario-b-slug="scenarioBSlug"
        />
      </div>
    </template>
  </two-panes-layout>
</template>
