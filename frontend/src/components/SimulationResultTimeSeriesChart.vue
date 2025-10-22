<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulationResultVariables'
import {
  useSimulationResultTimeSeriesStore,
  type TimeSeriesData
} from '@/stores/simulationResultTimeSeries'
import LineChart from './LineChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/scenarios'

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

const scenarioATimeSeries = ref<TimeSeriesData | null>(null)
const scenarioADescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  simulationResultTimeSeriesStore
    .getSimulationResultTimeSeries(props.scenarioASlug, props.variableSlug, props.pointSlug)
    .then((result) => {
      scenarioATimeSeries.value = result
    })
  scenarioStore.getScenarioBySlug(props.scenarioASlug).then((desc) => {
    scenarioADescription.value = desc
  })
})

const scenarioBTimeSeries = ref<TimeSeriesData | null>(null)
const scenarioBDescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (!props.scenarioBSlug) {
    scenarioBTimeSeries.value = null
    return
  }
  simulationResultTimeSeriesStore
    .getSimulationResultTimeSeries(props.scenarioBSlug, props.variableSlug, props.pointSlug)
    .then((result) => {
      scenarioBTimeSeries.value = result
    })
  scenarioStore.getScenarioBySlug(props.scenarioBSlug).then((desc) => {
    scenarioBDescription.value = desc
  })
})
</script>

<template>
  <div v-if="scenarioATimeSeries && scenarioADescription && variableAttributes" class="pa-8">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>

    <div class="heatmap-container">
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: scenarioATimeSeries.map((slot) => ({ name: slot.t }))
        }"
        :series="[
          {
            name: `${scenarioADescription.id} - ${scenarioADescription.scenario}`,
            data: scenarioATimeSeries.map((slot) => slot.v)
          },
          ...(scenarioBTimeSeries && scenarioBDescription
            ? [
                {
                  name: `${scenarioBDescription.id} - ${scenarioBDescription.scenario}`,
                  data: scenarioBTimeSeries.map((slot) => slot.v)
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
  aspect-ratio: 1;
  min-height: 500px;
  max-height: 80vh;
  max-width: 100%;
}
</style>
