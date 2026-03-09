<script setup lang="ts">
import ScenarioPreview from '@/components/simulation/ScenarioPreview.vue'
import TwoPanesLayoutSimple from '@/components/ui/TwoPanesLayoutSimple.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import {
  useScenariosStore,
  type TimeSeriesPoint
} from '@/stores/simulation/scenarios'
import { computed, ref, watchEffect } from 'vue'
import type { GraphLocationRealm } from './graphKindPickerUtils'

const props = defineProps<{
  scenarioSlugs: string[]
  locationRealm?: GraphLocationRealm
  onlyClosestToSurface?: boolean
  hideHeight?: boolean
}>()

const selectedPointSlug = defineModel<string | null>({ default: null })

const scenarioStore = useScenariosStore()
const timeSeriesPointsList = ref<TimeSeriesPoint[] | null>(null)
const selectedPoint = computed<TimeSeriesPoint | null>(() => {
  if (!selectedPointSlug.value || !timeSeriesPointsList.value) return null
  return timeSeriesPointsList.value.find((p) => p.s === selectedPointSlug.value) ?? null
})

watchEffect(() => {
  scenarioStore
    .getAvailableTimeSeriesPointsForScenario(props.scenarioSlugs[0])
    .then((tspl) => {
      timeSeriesPointsList.value = tspl
    })
})

const filteredPoints = computed<TimeSeriesPoint[]>(() => {
  if (!timeSeriesPointsList.value) return []

  let results = timeSeriesPointsList.value

  if (props.locationRealm === 'above-ground') {
    results = results.filter((v) => v.c[2] > 0)
  } else if (props.locationRealm === 'below-ground') {
    results = results.filter((v) => v.c[2] < 0)
  }

  if (props.onlyClosestToSurface) {
    const groupedByXY: Record<string, TimeSeriesPoint[]> = {}
    for (const point of results) {
      const key = `${point.c[0]}_${point.c[1]}`
      if (!groupedByXY[key]) groupedByXY[key] = []
      groupedByXY[key].push(point)
    }

    results = Object.values(groupedByXY).map((pts) =>
      pts.sort((a, b) => Math.abs(a.c[2]) - Math.abs(b.c[2]))[0]
    )
  }

  return results
})

function pointTitle(point: TimeSeriesPoint): string {
  return props.hideHeight
    ? point.n.slice(0, point.n.lastIndexOf('(')).trim()
    : point.n
}

function pointSubtitle(point: TimeSeriesPoint): string {
  const xFlipped = 198 - point.c[0]
  return `(x: ${xFlipped} ; y: ${point.c[1]}${props.hideHeight ? '' : ` ; z: ${point.c[2].toFixed(1)}`})`
}

function handleSelectionUpdate(value: string[]) {
  const newItem = value.find((v) => v !== selectedPointSlug.value)
  selectedPointSlug.value = newItem ?? null
}
</script>

<template>
  <two-panes-layout-simple
    title="Pick a point"
    :disable-left-pane-padding="true"
  >
    <template #left-pane>
      <tool-set>
        <v-list
          :selected="selectedPointSlug ? [selectedPointSlug] : []"
          :disabled="scenarioSlugs.length === 0"
          @update:selected="handleSelectionUpdate"
          class="pt-0 w-100"
        >
          <v-skeleton-loader
            v-if="!timeSeriesPointsList"
            type="list-item-two-line@6"
          />
          <v-list-item
            v-else
            v-for="point in filteredPoints"
            :key="point.s"
            :value="point.s"
            :title="pointTitle(point)"
            :subtitle="pointSubtitle(point)"
          />
        </v-list>
      </tool-set>
    </template>

    <template #default>
      <template v-if="scenarioSlugs.length > 0">
        <result-grid
          :numColumns="Math.min(2, scenarioSlugs.length)"
        >
          <scenario-preview
            v-for="slug in scenarioSlugs"
            :key="slug"
            :scenarioId="slug"
            :point="selectedPoint ? { x: selectedPoint.c[0], y: selectedPoint.c[1], z: selectedPoint.c[2] } : null"
          />
        </result-grid>
      </template>
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">
          {{
            scenarioSlugs.length === 0
              ? 'Please select a scenario first'
              : 'Please select a point on the left panel'
          }}
        </div>
      </div>
    </template>
  </two-panes-layout-simple>
</template>