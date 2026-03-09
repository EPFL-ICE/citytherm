<script setup lang="ts">
import {
  useScenariosStore,
  ScenarioCollectionLoader
} from '@/stores/simulation/scenarios'
import { computed, ref, watchEffect } from 'vue'
import SimulationResultPlaneHeatmap from '@/components/simulation/heatmap/SimulationResultPlaneHeatmap.vue'
import {
  type SimulationPlanePreset,
} from '@/lib/simulation/simulationResultPlanesUtils'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import HeatmapSettings from '@/components/simulation/heatmap/HeatmapSettings.vue'
import { useSimulationResultPlaneStore } from '@/stores/simulation/simulationResultPlane'

const scenarioStore = useScenariosStore()
const simulationResultStore = useSimulationResultPlaneStore()

const props = defineProps<{
  scenarios: string[]
  planeSlug: SimulationPlanePreset
  timeSlug: string
  variableSlug: string
}>()

const gridColumns = computed(() => Math.min(2, props.scenarios.length))

type ValueRangeOption = 'infer-individual' | 'infer-global' | 'fixed'
const rangeOption = ref<ValueRangeOption>('infer-global')

const globalMinMax = ref<{ min: number; max: number } | null>(null)
watchEffect(() => {
  globalMinMax.value = null
  if (rangeOption.value !== 'infer-global') {
    return
  }

  simulationResultStore
    .getMinMaxForMultipleScenariosSlugs(
      props.scenarios,
      props.planeSlug,
      props.timeSlug,
      props.variableSlug
    )
    .then((minMax) => {
      globalMinMax.value = minMax
    })
})
</script>

<template>
  <ScenarioCollectionLoader :result="scenarioStore.scenarios">
    <template #default="{ value: allScenarios }">
      <heatmap-settings
        :variable-slug="variableSlug"
        :hide-individual-min-max="rangeOption !== 'infer-individual'"
        :hide-special-points="true"
        :force-flip="true"
      >
        <template #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }">
          <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
            <div
              v-for="(scenario, i) in props.scenarios"
              :key="scenario"
              :class="{
                'right-border': i % gridColumns < gridColumns - 1,
              }"
            >
              <h3
                class="px-4 pb-2"
                style="max-width: 55vh"
              >
                {{ allScenarios.scenarios[scenario]?.id }} - {{ allScenarios.scenarios[scenario]?.name }}
              </h3>

              <simulation-result-plane-heatmap
                :plane-slug="props.planeSlug"
                :variable-slug="props.variableSlug"
                :time-slice-slug="props.timeSlug"
                :scenario-a-slug="scenario"
                :expected-value-range="expectedValueRange"
                :infer-min-max="inferMinMax && rangeOption === 'infer-individual'"
                :force-min-max="globalMinMax"
                :flip-x="flipX"
                :mode="mode"
                :show-special-points="showSpecialPoints"
                :small="true"
              />
            </div>
          </result-grid>
        </template>
      </heatmap-settings>
    </template>
  </ScenarioCollectionLoader>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
