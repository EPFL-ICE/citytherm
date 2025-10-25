<script setup lang="ts">
import { getSimulationPlanePresetsForParameters, type SimulationPlanePreset, type SimulationPlanePresetsMap } from '@/lib/simulation/simulationResultPlanesUtils';
import {
  useScenariosStore,
  type TimeSeriesPoint
} from '@/stores/scenarios'
import { computed, ref, watchEffect } from 'vue'
import { makePointSlugArray } from '@/stores/simulationResultTimeSeries'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  scenarioSlug: string
  label: string
}>()
const model = defineModel<string | null>()


const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioSlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
    console.log('timeSeriesPointsList', timeSeriesPointsList.value);
  })
})


const availablePlanes = computed<SimulationPlanePresetsMap>(() => {
  const buildingCanopyHeight = props.scenarioSlug.includes('S1') ? 30 : 16
  const midBuildingZ = props.scenarioSlug.includes('S2') ? 25 : 19

  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ)
})

function pointItemProps(item: TimeSeriesPoint) {
  return {
    title: `x: ${item.c[0]} ; y: ${item.c[1]} ; z: ${item.c[2]}`,
    subtitle: availablePlanes.value[item.p as SimulationPlanePreset].name,
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
