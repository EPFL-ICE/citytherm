<script setup lang="ts">
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimulationVariableList from '@/components/simulation/pickers/SimulationVariableList.vue'
import SimulationResultTimeSeriesDepthChart from '@/components/simulation/SimulationResultTimeSeriesDepthChart.vue'
import SimulationResultTimeSeriesMultiPointChart from '@/components/simulation/SimulationResultTimeSeriesMultiPointChart.vue'
import ScenarioSelect from '@/components/simulation/pickers/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/simulation/pickers/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import {
  makePathToPlaneExplorer,
  makePathToTimeSeriesDepthExplorerMerge,
  type TimeSeriesDepthExplorerParams
} from '@/lib/utils/routingUtils'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { mdiChevronLeft } from '@mdi/js'

const route = useRoute()
const router = useRouter()
const scenarioStore = useScenariosStore()

const pointSlug = computed(() => route.params.point as string)
const selectedVariables = computed(() => {
  const vars = route.query.vars as string | undefined
  return vars ? vars.split(',') : []
})
const scenarioSlug = computed(() => route.params.scenario as string)

const point = ref<TimeSeriesPoint | null>(null)
watch(
  [scenarioSlug, pointSlug],
  async () => {
    if (!scenarioSlug.value) return

    point.value = await scenarioStore.getFullTimeSeriesPointFromSlug(
      pointSlug.value,
      scenarioSlug.value
    )
  },
  { immediate: true }
)
const pointHeight = computed(() => {
  if (point.value) {
    return point.value.c[2]
  }
  return undefined
})

function goToUpdatedParams(params: Partial<TimeSeriesDepthExplorerParams>) {
  const routePath = makePathToTimeSeriesDepthExplorerMerge(params, {
    point: pointSlug.value,
    variables: selectedVariables.value,
    scenario: scenarioSlug.value
  })
  router.push(routePath)
}

const gridColumns = computed(() => Math.min(2, selectedVariables.value.length))
const planeExplorerUrl = computed(() => {
  if (selectedVariables.value.length < 1) return null
  return makePathToPlaneExplorer({
    scenarios: [scenarioSlug.value],
    plane: point.value?.p ?? 'horizontal_ground',
    time: 'time_12',
    variable: selectedVariables.value[0]
  })
})

const chart = ref<'depth' | 'temporal'>('depth')
</script>

<template>
  <two-panes-layout title="Time Series Depth" :disable-left-pane-padding="true">
    <template #subtitle>
      <v-btn
        :to="planeExplorerUrl!"
        :disabled="!planeExplorerUrl"
        :prepend-icon="mdiChevronLeft"
        color="primary"
        density="comfortable"
      >
        Back to Plane Explorer
      </v-btn>
    </template>
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="pa-4">
            <v-radio-group label="Chart" v-model="chart">
              <v-radio label="Depth" value="depth"></v-radio>
              <v-radio label="Temporal" value="temporal"></v-radio>
            </v-radio-group>
            <time-series-points-select
              :model-value="pointSlug"
              @update:model-value="goToUpdatedParams({ point: $event ?? undefined })"
              label="Time series point"
              above-or-below-ground="below-only"
              only-closest-to-surface
              hide-height
            />
            <scenario-select
              :model-value="scenarioSlug"
              @update:model-value="goToUpdatedParams({ scenario: $event ?? undefined })"
              label="Scenario"
              :force-checked="['S0']"
            />
          </div>
        </template>
        <template #default>
          <div>
            <simulation-variable-list
              :model-value="selectedVariables"
              :available-at="pointHeight"
              :rename-wall-and-facade-to-roof="(pointHeight ?? 0) >= 16"
              @update:model-value="goToUpdatedParams({ variables: $event })"
            />
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <template v-if="selectedVariables.length > 0 && scenarioSlug">
        <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
          <div
            v-for="(variable, i) in selectedVariables"
            :key="variable"
            :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
          >
            <simulation-result-time-series-depth-chart
              v-if="chart === 'depth'"
              :scenario="scenarioSlug"
              :point-slug="pointSlug"
              :variable-slug="variable"
            />
            <simulation-result-time-series-multi-point-chart
              v-else
              :scenario="scenarioSlug"
              :variable-slug="variable"
              :point-slug="pointSlug"
            />
          </div>
        </result-grid>
      </template>
      <template v-else>
        <div class="d-flex h-100 align-center justify-center">
          <div class="text-h4">Please select a scenario and a variable on the left panel</div>
        </div>
      </template>
    </template>
  </two-panes-layout>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
