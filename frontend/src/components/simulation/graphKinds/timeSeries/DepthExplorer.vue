<script setup lang="ts">
import { computed, ref } from 'vue'
import SimulationResultTimeSeriesDepthChart from '@/components/simulation/SimulationResultTimeSeriesDepthChart.vue'
import SimulationResultTimeSeriesMultiPointChart from '@/components/simulation/SimulationResultTimeSeriesMultiPointChart.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'

const props = defineProps<{
  scenarioSlug: string
  pointSlug: string
  variables: string[]
}>()

const gridColumns = computed(() => Math.min(2, props.variables.length))

const chart = ref<'depth' | 'temporal'>('depth')
</script>

<template>
  <template v-if="props.variables.length > 0 && props.scenarioSlug">
    <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
      <div
        v-for="(variable, i) in props.variables"
        :key="variable"
        :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
      >
        <simulation-result-time-series-depth-chart
          v-if="chart === 'depth'"
          :scenario="props.scenarioSlug"
          :point-slug="props.pointSlug"
          :variable-slug="variable"
        />
        <simulation-result-time-series-multi-point-chart
          v-else
          :scenario="props.scenarioSlug"
          :variable-slug="variable"
          :point-slug="props.pointSlug"
        />
      </div>
    </result-grid>
  </template>
  <template v-else>
    <div class="d-flex h-100 align-center justify-center">
      <div class="text-h4">Please select a scenario and a variable</div>
    </div>
  </template>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
