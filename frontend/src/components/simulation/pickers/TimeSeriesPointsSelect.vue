<script setup lang="ts">
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { computed, ref, watchEffect } from 'vue'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  scenarioSlug?: string
  label: string
  aboveOrBelowGround?: 'both' | 'above-only' | 'below-only'
}>()
const model = defineModel<string | null>()

const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
watchEffect(() => {
  scenarioStore.getAvailableTimeSeriesPointsForScenario(props.scenarioSlug).then((tspl) => {
    timeSeriesPointsList.value = tspl
  })
})

const filteredTimeSeriesPointsList = computed(() => {
  if (!timeSeriesPointsList.value) return []

  if (props.aboveOrBelowGround === 'above-only') {
    return timeSeriesPointsList.value.filter((v) => v.c[2] > 0)
  } else if (props.aboveOrBelowGround === 'below-only') {
    return timeSeriesPointsList.value.filter((v) => v.c[2] < 0)
  }

  return timeSeriesPointsList.value
})

function pointItemProps(item: TimeSeriesPoint) {
  const xFlipped = 198 - item.c[0]
  return {
    title: item.n,
    subtitle: `(x: ${xFlipped} ; y: ${item.c[1]} ; z: ${item.c[2].toFixed(1)})`,
    value: item.s
  }
}
</script>

<template>
  <v-select
    v-if="timeSeriesPointsList"
    v-model="model"
    :items="filteredTimeSeriesPointsList"
    :item-props="pointItemProps"
    label="Time series point"
    single-line
    :hide-details="true"
    density="comfortable"
    class="mb-2"
  />
</template>
