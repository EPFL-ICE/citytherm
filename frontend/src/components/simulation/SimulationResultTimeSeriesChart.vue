<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import {
  useSimulationResultTimeSeriesStore,
  type SimulationResultTimeSeriesComparison,
  type SimulationResultTimeSeriesMultiData
} from '@/stores/simulation/simulationResultTimeSeries'
import LineChart from '../charts/LineChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'

const props = defineProps<{
  scenarios: string[]
  variableSlug: string
  pointSlug: string
  compareToScenarioSlug?: string | null
}>()

const simulationResultTimeSeriesStore = useSimulationResultTimeSeriesStore()
const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const variableAttributes = ref<SimulationResultVariable | null>(null)

onMounted(async () => {
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[props.variableSlug]
  })
})

const timeSeries = ref<SimulationResultTimeSeriesMultiData | null>(null)
const scenarioADescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (props.scenarios.length < 1) return

  timeSeries.value = null
  simulationResultTimeSeriesStore
    .getSimulationResultMultiTimeSeries(props.scenarios, props.variableSlug, props.pointSlug)
    .then((result) => {
      timeSeries.value = result
    })

  scenarioStore.getScenarioDescriptionBySlug(props.scenarios[0]).then((desc) => {
    scenarioADescription.value = desc
  })
})

const scenarioAData = computed(() =>
  timeSeries.value ? Object.values(timeSeries.value.scenarios)[0] : null
)

const comparisonSeries = computed(() => {
  if (!props.compareToScenarioSlug) return null
  if (!timeSeries.value) return []

  const compareTo = timeSeries.value.scenarios[props.compareToScenarioSlug]
  if (!compareTo) return []

  return Object.entries(timeSeries.value.scenarios)
    .filter(([slug]) => slug !== props.compareToScenarioSlug)
    .map(([slug, data]) => {
      return {
        name: slug,
        data: data.map((slot, index) => slot.v - compareTo[index].v)
      }
    })
})

function areTrueCoordsDifferent(): boolean {
  if (!timeSeries.value) return false
  const threshold = 1

  const diffX = Math.abs(
    (timeSeries.value.requested_coords?.x ?? 0) - (timeSeries.value.true_coords?.x ?? 0)
  )
  const diffY = Math.abs(
    (timeSeries.value.requested_coords?.y ?? 0) - (timeSeries.value.true_coords?.y ?? 0)
  )

  return diffX > threshold || diffY > threshold
}
</script>

<template>
  <div v-if="timeSeries && scenarioADescription && variableAttributes" class="pa-8">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>
    <h4 v-if="timeSeries.true_coords && areTrueCoordsDifferent()">
      True coordinates: (x: {{ timeSeries.true_coords.x }}, y: {{ timeSeries.true_coords.y }})
    </h4>

    <div class="heatmap-container">
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: scenarioAData?.map((slot) => ({ name: slot.t.slice(0, 5) })) ?? []
        }"
        :series="
          Object.entries(timeSeries?.scenarios ?? {}).map(([slug, data]) => ({
            name: slug,
            data: data.map((slot) => slot.v),
            color: slug === props.compareToScenarioSlug ? '#FFC0CB' : undefined
          }))
        "
      />
    </div>
    <div v-if="comparisonSeries && comparisonSeries.length > 0" class="comparison-container">
      <h3>
        Comparison to {{ props.compareToScenarioSlug }} (SX - {{ props.compareToScenarioSlug }})
      </h3>
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: scenarioAData?.map((slot) => ({ name: slot.t.slice(0, 5) })) ?? []
        }"
        :series="comparisonSeries"
      />
    </div>
  </div>
  <div v-else>
    <v-skeleton-loader type="card"></v-skeleton-loader>
  </div>
</template>

<style scoped>
.heatmap-container {
  margin-top: 1rem;
  width: 100%;
  min-width: 300px;
  max-width: 100%;
  height: 600px;
  min-height: 500px;
  max-height: 50vh;
}

.comparison-container {
  height: 300px;
}
</style>
