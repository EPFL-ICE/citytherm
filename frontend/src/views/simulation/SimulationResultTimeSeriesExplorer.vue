<script setup lang="ts">
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import ToolSet from '@/components/ToolSet.vue'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimulationVariableList from '@/components/SimulationVariableList.vue'
import SimulationResultTimeSeriesChart from '@/components/SimulationResultTimeSeriesChart.vue'
import ScenarioSelect from '@/components/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ResultGrid.vue'
import { makePathToTimeSeriesMerge, type TimeSeriesPageParams } from '@/lib/utils/routingUtils'

const route = useRoute()
const router = useRouter()

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const pointSlug = computed(() => route.params.point as string)

const selectedVariables = shallowRef<string[]>([])

function goToUpdatedParams(params: Partial<TimeSeriesPageParams>) {
  const routePath = makePathToTimeSeriesMerge(params, {
    scenarioA: scenarioASlug.value,
    scenarioB: scenarioBSlug.value,
    point: pointSlug.value
  })
  router.push(routePath)
}

const gridColumns = computed(() => Math.min(2, selectedVariables.value.length))
</script>

<template>
  <two-panes-layout title="Simulation result time series explorer">
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
            <simulation-variable-list v-model="selectedVariables" />
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
