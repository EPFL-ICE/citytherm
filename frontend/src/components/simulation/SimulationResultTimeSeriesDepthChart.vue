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
import DepthChart from '../charts/DepthChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'
import {
  useSimulationResultTimeSeriesDepthStore,
  type TimeSeriesDepthData
} from '@/stores/simulation/simulationResultTimeSeriesDepth'
import { time } from 'echarts'

const props = defineProps<{
  scenario: string
  variableSlug: string
  pointSlug: string
}>()

const simulationResultTimeSeriesStore = useSimulationResultTimeSeriesDepthStore()
const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const variableAttributes = ref<SimulationResultVariable | null>(null)

onMounted(async () => {
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[props.variableSlug]
  })
})

const timeSeries = ref<TimeSeriesDepthData | null>(null)
const scenarioADescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (!props.scenario) return

  timeSeries.value = null
  simulationResultTimeSeriesStore
    .getSimulationResultTimeSeriesDepth(props.scenario, props.variableSlug, props.pointSlug)
    .then((result) => {
      timeSeries.value = result
    })

  scenarioStore.getScenarioDescriptionBySlug(props.scenario).then((desc) => {
    scenarioADescription.value = desc
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
      <depth-chart
        :axis-x="{
          name: 'Temperature (°C)'
        }"
        :series="
          timeSeries.data.map((dataPoint) => ({
            name: new Date(dataPoint.t).toLocaleTimeString().slice(0, 5),
            data: dataPoint.v.map((value, index) => [value, timeSeries!.depths_m[index]])
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
  height: 90vh;
  min-height: 700px;
  max-height: 100vh;
}

.comparison-container {
  height: 300px;
}
</style>
