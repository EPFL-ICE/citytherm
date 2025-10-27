<script setup lang="ts">
import MatrixHeatmap, { type HeatmapData } from '@/components/MatrixHeatmap.vue'
import { computed, onMounted, ref, watchEffect } from 'vue'
import {
  useSimulationResultPlaneStore,
  type SimulationResultPlaneAtomicData,
  type SimulationResultPlaneValues
} from '@/stores/simulationResultPlane'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulationResultVariables'
import {
  getExpectedValueRangeForVariable,
  getFinalPositionFromIndexAndAxes,
  getGraphAxesForPlane,
  type ExpectedValueRange,
  type GraphAxes,
  type GraphAxis
} from '@/lib/simulation/graphAxis'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/scenarios'
import { makePointSlugArray } from '@/stores/simulationResultTimeSeries'
import { useRouter } from 'vue-router'
import { simulationVariablesConfig } from '@/config/simulationVariablesConfig'
import { makePathToTimeSeries } from '@/lib/utils/routingUtils'

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug: string | null
  planeSlug: string
  timeSliceSlug: string
  variableSlug: string
}>()

const emit = defineEmits<{
  (e: 'point-clicked', pointSlug: string): void
}>()

const router = useRouter()

const simulationResultPlaneStore = useSimulationResultPlaneStore()
const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const simulation = ref<SimulationResultPlaneValues | null>(null)
const variableAttributes = ref<SimulationResultVariable | null>(null)

const showSpecialPoints = ref(true)
const inferMinMax = ref(true)

onMounted(async () => {
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[props.variableSlug]
  })
})

watchEffect(() => {
  simulationResultPlaneStore
    .getSimulationResultPlane(
      props.scenarioASlug,
      props.scenarioBSlug,
      props.variableSlug,
      props.timeSliceSlug,
      props.planeSlug
    )
    .then((result) => {
      simulation.value = result
    })
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioASlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

function getMetadataForDataIndex(
  indexX: number,
  indexY: number
): { pointSlug: string } | undefined {
  if (!timeSeriesPointsList.value) return undefined

  const { x: trueX, y: trueY } = getFinalPositionFromIndexAndAxes(
    indexX,
    indexY,
    getGraphAxesForPlane(props.planeSlug)
  )
  const point = timeSeriesPointsList.value.find(
    (point) => point.c[0] === trueX && point.c[1] === trueY
  )
  if (point) {
    return { pointSlug: makePointSlugArray(point.c) }
  }

  return undefined
}

function dataToHeatmapData(data: (number | null)[][]): HeatmapData[] {
  const heatmapData: HeatmapData[] = []
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      heatmapData.push({ value: [i, j, data[i][j]], metadata: getMetadataForDataIndex(i, j) })
    }
  }
  return heatmapData
}

const mode = ref<'scenarioA' | 'scenarioB' | 'difference'>('scenarioA')

const heatmapData = computed(() => {
  if (!simulation.value || !timeSeriesPointsList.value) return []

  switch (mode.value) {
    case 'scenarioA':
      return dataToHeatmapData(simulation.value.data.scenarioA)
    case 'scenarioB':
      return simulation.value.data.scenarioB
        ? dataToHeatmapData(simulation.value.data.scenarioB)
        : []
    case 'difference':
      return simulation.value.data.difference
        ? dataToHeatmapData(simulation.value.data.difference)
        : []
  }
})

function getMinMax(data: SimulationResultPlaneAtomicData | undefined | null): {
  min: number
  max: number
} {
  if (!data) return { min: 0, max: 100 }

  let min = Infinity
  let max = -Infinity

  for (const row of data) {
    for (const value of row) {
      if (value === null) continue
      if (value < min) min = value
      if (value > max) max = value
    }
  }

  return { min, max }
}

const minMaxOverriddenValues = computed(() => {
  if (!inferMinMax.value) return undefined

  switch (mode.value) {
    case 'scenarioA':
      return getMinMax(simulation.value?.data.scenarioA)
    case 'scenarioB':
      return getMinMax(simulation.value?.data.scenarioB)
    case 'difference':
      return getMinMax(simulation.value?.data.difference)
  }
})

const graphAxes = computed<GraphAxes>(() => getGraphAxesForPlane(props.planeSlug))

const expectedValueRange = computed<ExpectedValueRange>(() => {
  if (!variableAttributes.value) return { min: 0, max: 100 }

  return getExpectedValueRangeForVariable(variableAttributes.value, mode.value === 'difference')
})

const graphAspectRatio = computed(() => {
  return (
    (graphAxes.value.x.max * graphAxes.value.x.cellSize) /
    (graphAxes.value.y.max * graphAxes.value.y.cellSize)
  )
})

const colormap = computed<string[]>(() => {
  return simulationVariablesConfig[props.variableSlug]?.heatmap.colormap ?? undefined
})
</script>

<template>
  <div v-if="simulation && variableAttributes" class="pa-4 h-100">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>
    <v-btn-toggle
      v-if="scenarioBSlug"
      v-model="mode"
      color="primary"
      mandatory
      density="comfortable"
    >
      <v-btn value="scenarioA">Scenario A ({{ scenarioASlug }})</v-btn>
      <v-btn value="scenarioB">Scenario B ({{ scenarioBSlug }})</v-btn>
      <v-btn value="difference">Signed difference (A - B)</v-btn>
    </v-btn-toggle>
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
