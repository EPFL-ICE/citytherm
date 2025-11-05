<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import {
  useSimulationResultTimeSeriesStore,
  type SimulationResultTimeSeriesComparison
} from '@/stores/simulation/simulationResultTimeSeries'
import LineChart from '../charts/LineChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug: string | null
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

const timeSeries = ref<SimulationResultTimeSeriesComparison | null>(null)
const scenarioADescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  timeSeries.value = null
  simulationResultTimeSeriesStore
    .getSimulationResultTimeSeries(
      props.scenarioASlug,
      props.scenarioBSlug,
      props.variableSlug,
      props.pointSlug
    )
    .then((result) => {
      timeSeries.value = result
    })
  scenarioStore.getScenarioDescriptionBySlug(props.scenarioASlug).then((desc) => {
    scenarioADescription.value = desc
  })
})

const scenarioBDescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (!props.scenarioBSlug) {
    scenarioBDescription.value = null
    return
  }

  scenarioStore.getScenarioDescriptionBySlug(props.scenarioBSlug).then((desc) => {
    scenarioBDescription.value = desc
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
          slots: timeSeries.scenarioA.map((slot) => ({ name: slot.t.slice(0, 5) }))
        }"
        :series="
          timeSeries.difference
            ? [
                {
                  name: 'Difference',
                  data: timeSeries.difference.map((slot) => slot.v)
                }
              ]
            : []
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
  aspect-ratio: 1;
  min-height: 500px;
  max-height: 80vh;
  max-width: 100%;
}
</style>
