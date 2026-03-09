<script setup lang="ts">
import HeatmapExplorer from './heatmap/HeatmapExplorer.vue'
import HeatmapVariablesExplorer from './heatmap/HeatmapVariablesExplorer.vue'
import HeatmapComparator from './heatmap/HeatmapComparator.vue'
import TimeSeriesExplorer from './timeSeries/TimeSeriesExplorer.vue'
import TimeSeriesCategoryExplorer from './timeSeries/TimeSeriesCategoryExplorer.vue'
import TimeSeriesComparator from './timeSeries/TimeSeriesComparator.vue'
import DepthExplorer from './timeSeries/DepthExplorer.vue'
import type { GraphDesign } from '@/stores/simulation/graphs'

const props = defineProps<{
  graph: GraphDesign
}>()
</script>

<template>
  <template v-if="props.graph.variables.length < 1">
    <v-empty-state
      headline="No variable selected"
      title="Please select at least one variable to display the graph"
    />
  </template>
  <template v-else-if="props.graph.plane !== null && props.graph.time !== null">
    <heatmap-explorer
      v-if="props.graph.graphKindSlug === 'heatmap-scenarios' && props.graph.scenarios.length > 0"
      :scenarios="props.graph.scenarios"
      :plane-slug="props.graph.plane"
      :time-slug="props.graph.time"
      :variable-slug="props.graph.variables[0]"
    />
    <heatmap-variables-explorer
      v-if="props.graph.graphKindSlug === 'heatmap-variables' && props.graph.scenarios.length > 0"
      :scenario-slug="props.graph.scenarios[0]"
      :plane-slug="props.graph.plane"
      :time-slug="props.graph.time"
      :variables="props.graph.variables"
    />
    <heatmap-comparator
      v-if="
        props.graph.graphKindSlug === 'heatmap-compare-scenarios' &&
        props.graph.scenarios.length > 1
      "
      :scenario-a-slug="props.graph.scenarios[0]"
      :scenario-b-slug="props.graph.scenarios[1]"
      :plane-slug="props.graph.plane"
      :time-slug="props.graph.time"
      :variables="props.graph.variables"
    />
  </template>
  <template v-else-if="props.graph.point !== null">
    <time-series-explorer
      v-if="
        props.graph.graphKindSlug === 'temporal-explore-data' && props.graph.scenarios.length > 0
      "
      :scenarios="props.graph.scenarios"
      :point-slug="props.graph.point"
      :variables="props.graph.variables"
    />
    <time-series-category-explorer
      v-if="
        props.graph.graphKindSlug === 'temporal-explore-categories' &&
        props.graph.scenarios.length > 0
      "
      :scenario-slug="props.graph.scenarios[0]"
      :point-slug="props.graph.point"
      :categories="props.graph.variables"
    />
    <time-series-comparator
      v-if="
        props.graph.graphKindSlug === 'temporal-compare-scenarios' &&
        props.graph.scenarios.length > 1
      "
      :scenario-a-slug="props.graph.scenarios[0]"
      :scenario-b-slug="props.graph.scenarios[1]"
      :point-slug="props.graph.point"
      :variables="props.graph.variables"
    />
    <depth-explorer
      v-if="
        props.graph.graphKindSlug === 'temporal-explore-depth' && props.graph.scenarios.length > 0
      "
      :scenario-slug="props.graph.scenarios[0]"
      :point-slug="props.graph.point"
      :variables="props.graph.variables"
    />
  </template>
</template>
