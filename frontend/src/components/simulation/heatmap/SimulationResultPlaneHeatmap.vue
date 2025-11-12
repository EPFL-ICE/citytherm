<script setup lang="ts">
import MatrixHeatmap from '@/components/charts/MatrixHeatmap.vue'
import { computed, ref, watchEffect } from 'vue'
import {
  useSimulationResultPlaneStore,
  type SimulationResultPlaneValues
} from '@/stores/simulation/simulationResultPlane'
import {
  getGraphAxesForPlane,
  type ExpectedValueRange,
  type GraphAxes
} from '@/lib/simulation/graphAxis'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { simulationVariablesConfig } from '@/config/simulationVariablesConfig'
import { dataToHeatmapData, getMinMax, type DisplayMode } from './heatmapUtils'

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug?: string | null
  planeSlug: string
  timeSliceSlug: string
  variableSlug: string
  showSpecialPoints: boolean
  inferMinMax: boolean
  forceMinMax?: ExpectedValueRange | null
  expectedValueRange: ExpectedValueRange
  mode: DisplayMode
  flipX?: boolean
  small?: boolean
}>()

const emit = defineEmits<{
  (e: 'point-clicked', pointSlug: string): void
}>()

const simulationResultPlaneStore = useSimulationResultPlaneStore()
const scenarioStore = useScenariosStore()

const simulation = ref<SimulationResultPlaneValues | null>(null)

watchEffect(() => {
  simulation.value = null
  simulationResultPlaneStore
    .getSimulationResultPlane(
      props.scenarioASlug,
      props.scenarioBSlug ?? null,
      props.planeSlug,
      props.timeSliceSlug,
      props.variableSlug
    )
    .then((result) => {
      simulation.value = result
    })
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  timeSeriesPointsList.value = null
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioASlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const heatmapData = computed(() => {
  if (!simulation.value || !timeSeriesPointsList.value) return []

  switch (props.mode) {
    case 'scenarioA':
      return dataToHeatmapData(
        simulation.value.data.scenarioA,
        !!props.flipX,
        props.planeSlug,
        timeSeriesPointsList.value
      )
    case 'scenarioB':
      return simulation.value.data.scenarioB
        ? dataToHeatmapData(
            simulation.value.data.scenarioB,
            !!props.flipX,
            props.planeSlug,
            timeSeriesPointsList.value
          )
        : []
    case 'difference':
      return simulation.value.data.difference
        ? dataToHeatmapData(
            simulation.value.data.difference,
            !!props.flipX,
            props.planeSlug,
            timeSeriesPointsList.value
          )
        : []
  }
})

const minMaxOverriddenValues = computed(() => {
  if (props.forceMinMax) return props.forceMinMax
  if (!props.inferMinMax) return undefined

  switch (props.mode) {
    case 'scenarioA':
      return getMinMax(simulation.value?.data.scenarioA)
    case 'scenarioB':
      return getMinMax(simulation.value?.data.scenarioB)
    case 'difference':
      const minMax = getMinMax(simulation.value?.data.difference)
      const mostExtreme = Math.max(Math.abs(minMax.min), Math.abs(minMax.max))
      return {
        min: -mostExtreme,
        max: mostExtreme
      }
  }
})

const graphAxes = computed<GraphAxes>(() => getGraphAxesForPlane(props.planeSlug))

const graphAspectRatio = computed(() => {
  return (
    (50 + graphAxes.value.x.max * graphAxes.value.x.cellSize) /
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
  <div v-if="simulation" class="h-100">
    <div
      :class="['heatmap-container', { small: props.small }]"
      :style="`aspect-ratio: ${graphAspectRatio}`"
    >
      <matrix-heatmap
        v-if="simulation"
        :axisX="graphAxes.x"
        :axisY="graphAxes.y"
        :expected-value-range="props.expectedValueRange"
        :data="heatmapData"
        :show-special-points="props.showSpecialPoints"
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

.heatmap-container.small {
  max-height: 45vh;
}
</style>
