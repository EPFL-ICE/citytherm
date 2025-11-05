<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import {
  type SimulationResultVariable,
  useSimulationResultVariablesStore
} from '@/stores/simulation/simulationResultVariables'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import type { DisplayMode } from './heatmapUtils'
import {
  getExpectedValueRangeForVariable,
  type ExpectedValueRange
} from '@/lib/simulation/graphAxis'

const props = defineProps<{
  scenarioASlug?: string
  scenarioBSlug?: string | null
  variableSlug: string
  forceMode?: DisplayMode
}>()

const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const scenarioStore = useScenariosStore()

const variableAttributes = ref<SimulationResultVariable | null>(null)

const showSpecialPoints = ref(true)
const inferMinMax = ref(true)

watchEffect(() => {
  const slug = props.variableSlug // Needed for reactivity
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[slug]
  })
})

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  timeSeriesPointsList.value = null
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioASlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const selectedMode = ref<DisplayMode>('scenarioA')

function getMode() {
  return props.forceMode ? props.forceMode : selectedMode.value
}

const expectedValueRange = computed<ExpectedValueRange>(() => {
  if (!variableAttributes.value) return { min: 0, max: 100 }

  return getExpectedValueRangeForVariable(variableAttributes.value, getMode() === 'difference')
})
</script>

<template>
  <div v-if="variableAttributes">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>
    <v-btn-toggle
      v-if="scenarioASlug && scenarioBSlug && !props.forceMode"
      v-model="selectedMode"
      color="primary"
      mandatory
      density="comfortable"
    >
      <v-btn value="scenarioA">Scenario A ({{ scenarioASlug }})</v-btn>
      <v-btn value="scenarioB">Scenario B ({{ scenarioBSlug }})</v-btn>
      <v-btn value="difference">Signed difference (A - B)</v-btn>
    </v-btn-toggle>
    <div class="toolbar">
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

      <div class="switches">
        <slot name="right-toolbar" />
      </div>
    </div>
  </div>

  <slot
    :inferMinMax="inferMinMax"
    :showSpecialPoints="showSpecialPoints"
    :mode="getMode()"
    :expectedValueRange="expectedValueRange"
  ></slot>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  border-bottom: 1px solid lightgrey;
}
.switches {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}
</style>
