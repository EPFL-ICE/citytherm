<script setup lang="ts">
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { ref, watchEffect } from 'vue'

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
    :items="timeSeriesPointsList ?? []"
    :item-props="pointItemProps"
    label="Time series point"
    single-line
    :hide-details="true"
    density="comfortable"
    class="mb-2"
  />
</template>
