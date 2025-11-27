<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  type SluggedSimulationResultVariable,
  type SluggedVariableAttributes,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import {
  useSimulationResultTimeSeriesStore,
  type SimulationResultTimeSeriesComparison,
  type SimulationResultTimeSeriesMultiData,
  type SimulationResultTimeSeriesMultiVariableData
} from '@/stores/simulation/simulationResultTimeSeries'
import LineChart from '../charts/LineChart.vue'
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'

const props = defineProps<{
  scenarioSlug: string
  categorySlug: string
  pointSlug: string
}>()

const simulationResultTimeSeriesStore = useSimulationResultTimeSeriesStore()
const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const variablesAttributes = ref<SluggedVariableAttributes | null>(null)

onMounted(async () => {
  simulationResultsVariablesStore.getVarriableAttributesSlugged().then((variables) => {
    variablesAttributes.value = variables
  })
})

const filteredVariables = computed(
  () =>
    variablesAttributes.value?.variables.filter((v) => v.category_slug === props.categorySlug) ?? []
)

const timeSeries = ref<SimulationResultTimeSeriesMultiVariableData | null>(null)
const scenarioDescription = ref<ScenarioDescription | null>(null)
watchEffect(() => {
  if (!props.scenarioSlug || filteredVariables.value.length < 1) return

  timeSeries.value = null
  simulationResultTimeSeriesStore
    .getSimulationResultMultiVariableTimeSeries(
      props.scenarioSlug,
      filteredVariables.value.map((v) => v.slug),
      props.pointSlug
    )
    .then((result) => {
      timeSeries.value = result
    })

  scenarioStore.getScenarioDescriptionBySlug(props.scenarioSlug).then((desc) => {
    scenarioDescription.value = desc
  })
})

const variableAData = computed(() =>
  timeSeries.value ? Object.values(timeSeries.value.variables)[0] : null
)

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
  <div v-if="timeSeries && scenarioDescription" class="pa-8">
    <h2>{{ variablesAttributes?.categories[props.categorySlug]?.name }}</h2>
    <h4 v-if="timeSeries.true_coords && areTrueCoordsDifferent()">
      True coordinates: (x: {{ timeSeries.true_coords.x }}, y: {{ timeSeries.true_coords.y }})
    </h4>

    <div class="heatmap-container">
      <line-chart
        :axis-x="{
          name: 'Time',
          slots: variableAData?.map((slot) => ({ name: slot.t.slice(0, 5) })) ?? []
        }"
        :series="
          Object.entries(timeSeries?.variables ?? {}).map(([slug, data]) => ({
            name: variablesAttributes?.variables.find((v) => v.slug === slug)?.long_name || slug,
            data: data.map((slot) => slot.v)
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
