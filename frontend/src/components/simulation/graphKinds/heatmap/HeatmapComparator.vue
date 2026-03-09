<script setup lang="ts">
import { computed } from 'vue'
import SimulationResultPlaneHeatmap from '@/components/simulation/heatmap/SimulationResultPlaneHeatmap.vue'
import { type SimulationPlanePreset } from '@/lib/simulation/simulationResultPlanesUtils'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import HeatmapSettings from '@/components/simulation/heatmap/HeatmapSettings.vue'

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug: string | null
  planeSlug: SimulationPlanePreset
  timeSlug: string
  variables: string[]
}>()

const gridColumns = computed(() => Math.min(3, props.variables.length))
</script>

<template>
  <template v-if="props.variables.length > 0">
    <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
      <div
        v-for="(variable, i) in props.variables"
        :key="variable"
        :class="[{ 'right-border': i % gridColumns < gridColumns - 1 }, 'pa-4']"
      >
        <heatmap-settings
          :variable-slug="variable"
          :scenario-a-slug="props.scenarioASlug"
          :scenario-b-slug="props.scenarioBSlug"
          :force-mode="'difference'"
          :force-flip="true"
          :hide-special-points="true"
        >
          <template #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }">
            <simulation-result-plane-heatmap
              :plane-slug="props.planeSlug"
              :variable-slug="variable"
              :time-slice-slug="props.timeSlug"
              :scenario-a-slug="props.scenarioASlug"
              :scenario-b-slug="props.scenarioBSlug"
              :expected-value-range="expectedValueRange"
              :infer-min-max="inferMinMax"
              :mode="mode"
              :show-special-points="showSpecialPoints"
              :flip-x="flipX"
              :small="true"
            />
          </template>
        </heatmap-settings>
      </div>
    </result-grid>
  </template>
  <template v-else>
    <div class="d-flex h-100 align-center justify-center">
      <div class="text-h4">Please select a variable</div>
    </div>
  </template>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>