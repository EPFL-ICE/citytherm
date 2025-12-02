<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import {
  useSimulationResultTimeSeriesStore,
  type SimulationResultTimeSeriesMultiPointData,
  type TimeSeriesData
} from '@/stores/simulation/simulationResultTimeSeries'
import LineChart from '../charts/LineChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'

const props = defineProps<{
  scenario: string
  variableSlug: string
  pointSlug: string
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

const timeSeries = ref<SimulationResultTimeSeriesMultiPointData | null>(null)
const scenarioADescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (props.scenario.length < 1) return

  timeSeries.value = null
  simulationResultTimeSeriesStore
    .getSimulationResultMultiPointTimeSeries(props.scenario, props.variableSlug, props.pointSlug)
    .then((result) => {
      timeSeries.value = result
    })

  scenarioStore.getScenarioDescriptionBySlug(props.scenario).then((desc) => {
    scenarioADescription.value = desc
  })
})

function areTrueCoordsDifferent(point: TimeSeriesData): boolean {
  if (!timeSeries.value) return false
  const threshold = 1

  const diffX = Math.abs((point.requested_coords?.x ?? 0) - (point.true_coords?.x ?? 0))
  const diffY = Math.abs((point.requested_coords?.y ?? 0) - (point.true_coords?.y ?? 0))

  return diffX > threshold || diffY > threshold
}
</script>

<template>
  <div v-if="timeSeries && scenarioADescription && variableAttributes" class="pa-8">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>

    <div class="heatmap-container">
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: timeSeries?.times.map((slot) => ({ name: slot.slice(10, 16) })) ?? []
        }"
        :series="
          timeSeries.data.map((point) => ({
            name: `${point.d.toFixed(3)}m`,
            data: point.v
          }))
        "
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
