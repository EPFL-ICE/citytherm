<script setup lang="ts">
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimulationVariableList from '@/components/simulation/pickers/SimulationVariableList.vue'
import SimulationResultTimeSeriesChart from '@/components/simulation/SimulationResultTimeSeriesChart.vue'
import ScenarioSelect from '@/components/simulation/pickers/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/simulation/pickers/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import {
  makePathToPlane,
  makePathToTimeSeriesMerge,
  type TimeSeriesPageParams
} from '@/lib/utils/routingUtils'
import { useScenariosStore } from '@/stores/simulation/scenarios'
import { mdiChevronLeft } from '@mdi/js'

const route = useRoute()
const router = useRouter()
const scenarioStore = useScenariosStore()

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const pointSlug = computed(() => route.params.point as string)
const selectedVariables = computed(() => {
  const vars = route.query.vars as string | undefined
  return vars ? vars.split(',') : []
})

function goToUpdatedParams(params: Partial<TimeSeriesPageParams>) {
  const routePath = makePathToTimeSeriesMerge(params, {
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: pointSlug.value,
    variables: selectedVariables.value
  })
  router.push(routePath)
}

const gridColumns = computed(() => Math.min(2, selectedVariables.value.length))

const planeExplorerUrl = computed(() => {
  return makePathToPlane({
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    plane:
      scenarioStore.getFullTimeSeriesPointFromSlugOrNull(scenarioASlug.value, pointSlug.value)?.p ??
      'horizontal_ground',
    time: 'time_12',
    variables: selectedVariables.value
  })
})
</script>

<template>
  <two-panes-layout title="Time Series Data Explorer">
    <template #subtitle>
      <v-btn
        :to="planeExplorerUrl"
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
          <scenario-select
            :model-value="scenarioASlug"
            @update:model-value="goToUpdatedParams({ scenarioA: $event ?? undefined })"
            label="Scenario A"
          />
          <scenario-select
            :model-value="scenarioBSlug"
            @update:model-value="goToUpdatedParams({ scenarioB: $event ?? undefined })"
            label="Scenario B"
            :compare-option="true"
          />
          <time-series-points-select
            :scenario-slug="scenarioASlug"
            :model-value="pointSlug"
            @update:model-value="goToUpdatedParams({ point: $event ?? undefined })"
            label="Time series point"
          />
        </template>
        <template #default>
          <div>
            <simulation-variable-list
              :model-value="selectedVariables"
              @update:model-value="goToUpdatedParams({ variables: $event })"
            />
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <template v-if="selectedVariables.length > 0">
        <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
          <div
            v-for="(variable, i) in selectedVariables"
            :key="variable"
            :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
          >
            <simulation-result-time-series-chart
              :scenario-a-slug="scenarioASlug"
              :scenario-b-slug="scenarioBSlug"
              :point-slug="pointSlug"
              :variable-slug="variable"
            />
          </div>
        </result-grid>
      </template>
      <template v-else>
        <div class="d-flex h-100 align-center justify-center">
          <div class="text-h4">Please select a variable on the left panel</div>
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
