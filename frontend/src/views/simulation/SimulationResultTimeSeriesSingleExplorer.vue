<script setup lang="ts">
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimulationVariableList from '@/components/simulation/pickers/SimulationVariableList.vue'
import SimulationVariableCategoryList from '@/components/simulation/pickers/SimulationVariableCategoryList.vue'
import SimulationResultTimeSeriesChartCategory from '@/components/simulation/SimulationResultTimeSeriesChartCategory.vue'
import ScenarioSelect from '@/components/simulation/pickers/ScenarioSelect.vue'
import TimeSeriesPointsSelect from '@/components/simulation/pickers/TimeSeriesPointsSelect.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import {
  makePathToTimeSeriesExplorer,
  makePathToTimeSeriesSingleExplorerMerge,
  type TimeSeriesSingleExplorerParams
} from '@/lib/utils/routingUtils'
import { useScenariosStore, type TimeSeriesPoint } from '@/stores/simulation/scenarios'
import { mdiChevronLeft } from '@mdi/js'

const route = useRoute()
const router = useRouter()
const scenarioStore = useScenariosStore()

const scenarioSlug = computed(() => route.params.scenario as string)
const pointSlug = computed(() => route.params.point as string)
const categories = computed(() => {
  const cats = route.query.categories as string | undefined
  return cats ? cats.split(',') : []
})

const point = ref<TimeSeriesPoint | null>(null)
watch(
  [scenarioSlug, pointSlug],
  async () => {
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

function goToUpdatedParams(params: Partial<TimeSeriesSingleExplorerParams>) {
  const routePath = makePathToTimeSeriesSingleExplorerMerge(params, {
    scenario: scenarioSlug.value,
    point: pointSlug.value,
    categories: categories.value
  })
  router.push(routePath)
}

const gridColumns = computed(() => Math.min(3, categories.value.length))

const explorerUrl = computed(() => {
  return makePathToTimeSeriesExplorer({
    scenarios: [scenarioSlug.value],
    variables: [],
    point: pointSlug.value
  })
})
</script>

<template>
  <two-panes-layout title="Time Series Data Comparator" :disable-left-pane-padding="true">
    <template #subtitle>
      <v-btn :to="explorerUrl" :prepend-icon="mdiChevronLeft" color="primary" density="comfortable">
        Back to Explorer
      </v-btn>
    </template>
    <template #left-pane>
      <tool-set>
        <template #header>
          <div class="pa-4">
            <scenario-select
              :model-value="scenarioSlug"
              @update:model-value="goToUpdatedParams({ scenario: $event ?? undefined })"
              label="Scenario"
            />
            <time-series-points-select
              :scenario-slug="scenarioSlug"
              :model-value="pointSlug"
              @update:model-value="goToUpdatedParams({ point: $event ?? undefined })"
              label="Time series point"
            />
          </div>
        </template>
        <template #default>
          <div>
            <simulation-variable-category-list
              ref="categorySelector"
              :model-value="categories"
              :available-at="pointHeight"
              :rename-wall-and-facade-to-roof="(pointHeight ?? 0) >= 16"
              @update:model-value="goToUpdatedParams({ categories: $event })"
            />
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <template v-if="categories.length > 0">
        <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
          <div
            v-for="(category, i) in categories"
            :key="category"
            :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
          >
            <simulation-result-time-series-chart-category
              :scenario-slug="scenarioSlug"
              :point-slug="pointSlug"
              :category-slug="category"
            />
          </div>
        </result-grid>
      </template>
      <template v-else>
        <div class="d-flex h-100 align-center justify-center">
          <div class="text-h4">Please select a category on the left panel</div>
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
