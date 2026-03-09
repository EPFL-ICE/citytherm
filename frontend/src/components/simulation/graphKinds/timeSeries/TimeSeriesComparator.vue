<script setup lang="ts">
import { computed } from 'vue'
import SimulationResultTimeSeriesDifferenceChart from '@/components/simulation/SimulationResultTimeSeriesDifferenceChart.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug: string | null
  pointSlug: string
  variables: string[]
}>()

const gridColumns = computed(() => Math.min(2, props.variables.length))
</script>

<template>
  <template v-if="props.variables.length > 0 && props.scenarioBSlug">
    <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
      <div
        v-for="(variable, i) in props.variables"
        :key="variable"
        :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
      >
        <simulation-result-time-series-difference-chart
          :scenario-a-slug="props.scenarioASlug"
          :scenario-b-slug="props.scenarioBSlug"
          :point-slug="props.pointSlug"
          :variable-slug="variable"
        />
      </div>
    </result-grid>
  </template>
  <template v-else>
    <div class="d-flex h-100 align-center justify-center">
      <div class="text-h4">Please select a variable and 2 scenarios</div>
    </div>
  </template>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>