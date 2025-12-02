<script setup lang="ts">
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { computed, ref, watchEffect } from 'vue'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  scenarioSlug?: string
  label: string
  aboveOrBelowGround?: 'both' | 'above-only' | 'below-only'
  onlyClosestToSurface?: boolean
  hideHeight?: boolean
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

  let results = timeSeriesPointsList.value

  if (props.aboveOrBelowGround === 'above-only') {
    results = timeSeriesPointsList.value.filter((v) => v.c[2] > 0)
  } else if (props.aboveOrBelowGround === 'below-only') {
    results = timeSeriesPointsList.value.filter((v) => v.c[2] < 0)
  }

  if (props.onlyClosestToSurface) {
    const groupedByXY: Record<string, TimeSeriesPoint[]> = {}
    for (const point of results) {
      const key = `${point.c[0]}_${point.c[1]}`
      if (!groupedByXY[key]) {
        groupedByXY[key] = []
      }
      groupedByXY[key].push(point)
    }

    const closestPoints: TimeSeriesPoint[] = []
    for (const key in groupedByXY) {
      const pointsAtXY = groupedByXY[key]
      pointsAtXY.sort((a, b) => Math.abs(a.c[2]) - Math.abs(b.c[2]))
      closestPoints.push(pointsAtXY[0])
    }
    results = closestPoints
  }

  return results
})

function pointItemProps(item: TimeSeriesPoint) {
  const xFlipped = 198 - item.c[0]
  return {
    title: props.hideHeight ? item.n.slice(0, item.n.lastIndexOf('(')).trim() : item.n,
    subtitle: `(x: ${xFlipped} ; y: ${item.c[1]}${props.hideHeight ? '' : ` ; z: ${item.c[2].toFixed(1)}`})`,
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
