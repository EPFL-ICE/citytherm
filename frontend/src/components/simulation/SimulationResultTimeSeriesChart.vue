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
  scenarioStore.getScenarioBySlug(props.scenarioASlug).then((desc) => {
    scenarioADescription.value = desc
  })
})

const scenarioBDescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (!props.scenarioBSlug) {
    scenarioBDescription.value = null
    return
  }

  scenarioStore.getScenarioBySlug(props.scenarioBSlug).then((desc) => {
    scenarioBDescription.value = desc
  })
})
</script>

<template>
  <div v-if="timeSeries && scenarioADescription && variableAttributes" class="pa-8">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>

    <div class="heatmap-container">
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: timeSeries.scenarioA.map((slot) => ({ name: slot.t.slice(0, 5) }))
        }"
        :series="[
          {
            name: `${scenarioADescription.id} - ${scenarioADescription.scenario}`,
            data: timeSeries.scenarioA.map((slot) => slot.v)
          },
          ...(timeSeries.scenarioB && scenarioBDescription
            ? [
                {
                  name: `${scenarioBDescription.id} - ${scenarioBDescription.scenario}`,
                  data: timeSeries.scenarioB.map((slot) => slot.v)
                }
              ]
            : []),
          ...(timeSeries.difference
            ? [
                {
                  name: 'Difference',
                  data: timeSeries.difference.map((slot) => slot.v)
                }
              ]
            : [])
        ]"
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
