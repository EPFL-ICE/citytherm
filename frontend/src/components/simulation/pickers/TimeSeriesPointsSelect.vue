<script setup lang="ts">
import {
  getSimulationPlanePresetsForParameters,
  getSimulationPresetsForScenarioSlug,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { computed, ref, watchEffect } from 'vue'
import { makePointSlugArray } from '@/stores/simulation/simulationResultTimeSeries'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  scenarioSlug?: string
  label: string
}>()
const model = defineModel<string | null>()

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioSlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const availablePlanes = computed<SimulationPlanePresetsMap>(() =>
  getSimulationPresetsForScenarioSlug(props.scenarioSlug)
)

function pointItemProps(item: TimeSeriesPoint) {
  const xFlipped = 198 - item.c[0]
  return {
    title: `x: ${item.c[0]} ; y: ${item.c[1]} ; z: ${item.c[2].toFixed(1)}`,
    // subtitle: availablePlanes.value[item.p as SimulationPlanePreset].name,
    subtitle: `(Once flipped : x: ${xFlipped} ; y: ${item.c[1]} ; z: ${item.c[2].toFixed(1)})`,
    value: makePointSlugArray(item.c)
  }
}
</script>

<template>
  <v-select
    v-if="timeSeriesPointsList"
    v-model="model"
    :items="timeSeriesPointsList ?? []"
    :item-props="pointItemProps"
    label="Time series point"
    single-line
    :hide-details="true"
    density="comfortable"
    class="mb-2"
  />
</template>
