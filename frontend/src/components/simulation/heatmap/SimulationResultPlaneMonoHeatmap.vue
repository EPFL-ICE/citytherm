<script setup lang="ts">
import MatrixHeatmap, { type HeatmapData } from '@/components/charts/MatrixHeatmap.vue'
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  useSimulationResultPlaneStore,
  type SimulationResultPlaneAtomicData,
  type SimulationResultPlaneData,
  type SimulationResultPlaneValues
} from '@/stores/simulation/simulationResultPlane'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import {
  getExpectedValueRangeForVariable,
  getFinalPositionFromIndexAndAxes,
  getGraphAxesForPlane,
  type ExpectedValueRange,
  type GraphAxes,
  type GraphAxis
} from '@/lib/simulation/graphAxis'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { makePointSlugArray } from '@/stores/simulation/simulationResultTimeSeries'
import { simulationVariablesConfig } from '@/config/simulationVariablesConfig'
import { dataToHeatmapData, getMinMax } from './heatmapUtils'

const props = defineProps<{
  scenarioSlug: string
  planeSlug: string
  timeSliceSlug: string
  variableSlug: string
}>()

const emit = defineEmits<{
  (e: 'point-clicked', pointSlug: string): void
}>()

const simulationResultPlaneStore = useSimulationResultPlaneStore()
const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const simulation = ref<SimulationResultPlaneData | null>(null)
const variableAttributes = ref<SimulationResultVariable | null>(null)

const showSpecialPoints = ref(true)
const inferMinMax = ref(true)

onMounted(async () => {
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[props.variableSlug]
  })
})

watchEffect(() => {
  simulation.value = null
  simulationResultPlaneStore
    .getPlaneDataForScenario(
      props.scenarioSlug,
      props.planeSlug,
      props.timeSliceSlug,
      props.variableSlug
    )
    .then((data) => {
      simulation.value = data
    })
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  timeSeriesPointsList.value = null
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioSlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const heatmapData = computed(() => {
  if (!simulation.value || !timeSeriesPointsList.value) return []
  return dataToHeatmapData(
    simulation.value.data,
    false,
    props.planeSlug,
    timeSeriesPointsList.value
  )
})

const minMaxOverriddenValues = computed(() => {
  if (!inferMinMax.value) return undefined
  return getMinMax(simulation.value?.data)
})

const graphAxes = computed<GraphAxes>(() => getGraphAxesForPlane(props.planeSlug))

const expectedValueRange = computed<ExpectedValueRange>(() => {
  if (!variableAttributes.value) return { min: 0, max: 100 }
  return getExpectedValueRangeForVariable(variableAttributes.value, false)
})

const graphAspectRatio = computed(() => {
  return (
    (graphAxes.value.x.max * graphAxes.value.x.cellSize) /
    (graphAxes.value.y.max * graphAxes.value.y.cellSize)
  )
})

const colormap = computed<string[]>(() => {
  return (
    simulationVariablesConfig[props.variableSlug]?.heatmap.colormap ??
    simulationVariablesConfig.default.heatmap.colormap
  )
})
</script>

<template>
  <div v-if="simulation && variableAttributes" class="pa-4 h-100">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>
    <div class="switches">
      <v-switch
        v-model="inferMinMax"
        label="Infer min/max from data"
        class="ml-4"
        density="comfortable"
        :hide-details="true"
      />
      <v-switch
        v-model="showSpecialPoints"
        label="Highlight available time series points"
        class="ml-4"
        density="comfortable"
        :hide-details="true"
      />
    </div>

    <div class="heatmap-container" :style="`aspect-ratio: ${graphAspectRatio}`">
      <matrix-heatmap
        v-if="simulation"
        :axisX="graphAxes.x"
        :axisY="graphAxes.y"
        :expected-value-range="expectedValueRange"
        :data="heatmapData"
        :show-special-points="showSpecialPoints"
        :override-min-max="minMaxOverriddenValues"
        :colormap="colormap"
        :reset-visual-map-range-on-data-change="true"
        @point-clicked="(pointSlug) => emit('point-clicked', pointSlug)"
      />
    </div>
  </div>
  <div v-else>
    <v-skeleton-loader type="card"></v-skeleton-loader>
  </div>
</template>

<style scoped>
.heatmap-container {
  max-width: 100%;
  max-height: 80vh;
}

.switches {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;

  border-bottom: 1px solid lightgrey;
}
</style>
