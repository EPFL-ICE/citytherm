<script setup lang="ts">
import { computed } from 'vue'
import SimulationResultTimeSeriesChartCategory from '@/components/simulation/SimulationResultTimeSeriesChartCategory.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'

const props = defineProps<{
  scenarioSlug: string
  pointSlug: string
  categories: string[]
}>()

const gridColumns = computed(() => Math.min(3, props.categories.length))
</script>

<template>
  <template v-if="props.categories.length > 0">
    <result-grid :numColumns="gridColumns" :rerender-on-columns-change="true">
      <div
        v-for="(category, i) in props.categories"
        :key="category"
        :class="{ 'right-border': i % gridColumns < gridColumns - 1 && i < gridColumns - 1 }"
      >
        <simulation-result-time-series-chart-category
          :scenario-slug="props.scenarioSlug"
          :point-slug="props.pointSlug"
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

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}
</style>