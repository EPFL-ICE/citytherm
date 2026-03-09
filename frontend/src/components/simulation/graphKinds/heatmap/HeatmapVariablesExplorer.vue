<script setup lang="ts">
import { computed } from 'vue'
import SimulationResultPlaneHeatmap from '@/components/simulation/heatmap/SimulationResultPlaneHeatmap.vue'
import { type SimulationPlanePreset } from '@/lib/simulation/simulationResultPlanesUtils'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import HeatmapSettings from '@/components/simulation/heatmap/HeatmapSettings.vue'

const props = defineProps<{
  scenarioSlug: string
  planeSlug: SimulationPlanePreset
  timeSlug: string
  variables: string[]
}>()

const gridColumns = computed(() => Math.min(3, props.variables.length))
</script>

<template>
  <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
    <div
      v-for="(variable, i) in props.variables"
      :key="variable"
      :class="{
        'right-border': i % gridColumns < gridColumns - 1
      }"
    >
      <heatmap-settings
        :variable-slug="variable"
        :hide-individual-min-max="false"
        :force-flip="true"
        :hide-special-points="true"
        class="mb-2"
      >
        <template #default="{ expectedValueRange, inferMinMax, mode, showSpecialPoints, flipX }">
          <simulation-result-plane-heatmap
            :plane-slug="props.planeSlug"
            :variable-slug="variable"
            :time-slice-slug="props.timeSlug"
            :scenario-a-slug="props.scenarioSlug"
            :expected-value-range="expectedValueRange"
            :infer-min-max="inferMinMax"
            :flip-x="flipX"
            :mode="mode"
            :show-special-points="showSpecialPoints"
            :small="true"
          />
        </template>
      </heatmap-settings>
    </div>
  </result-grid>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
