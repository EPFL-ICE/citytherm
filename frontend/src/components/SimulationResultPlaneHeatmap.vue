<script setup lang="ts">
import MatrixHeatmap from '@/components/MatrixHeatmap.vue';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useSimulationResultPlaneStore, type SimulationResultPlaneValues } from '@/stores/simulationResultPlane';
import { type SimulationResultVariable, useSimulationResultVariablesStore } from '@/stores/simulationResultVariables';
import { getExpectedValueRangeForVariable, getGraphAxesForPlane, type ExpectedValueRange, type GraphAxes, type GraphAxis } from '@/lib/simulation/graphAxis';

const props = defineProps<{
  scenarioASlug: string
  scenarioBSlug: string | null
  planeSlug: string
  timeSliceSlug: string
  variableSlug: string
}>()

const simulationResultPlaneStore = useSimulationResultPlaneStore();
const simulationResultsVariablesStore = useSimulationResultVariablesStore();

const simulation = ref<SimulationResultPlaneValues | null>(null);
const variableAttributes = ref<SimulationResultVariable | null>(null);

onMounted(async () => {
  simulationResultsVariablesStore.getSimulationResultVariables().then((variables) => {
    variableAttributes.value = variables[props.variableSlug];
  });
});

watchEffect(() => {
  simulationResultPlaneStore.getSimulationResultPlane(props.scenarioASlug, props.scenarioBSlug, props.variableSlug, props.timeSliceSlug, props.planeSlug).then((result) => {
    simulation.value = result;
  });
});

function dataToHeatmapData(data: number[][]): [number, number, number][] {
  const heatmapData: [number, number, number][] = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      heatmapData.push([i, j, data[i][j]]);
    }
  }
  return heatmapData;
}

const mode = ref<'scenarioA' | 'scenarioB' | 'difference'>('scenarioA');

const heatmapData = computed(() => {
  if (!simulation.value) return [];

  switch (mode.value) {
    case 'scenarioA':
      return dataToHeatmapData(simulation.value.data.scenarioA);
    case 'scenarioB':
      return simulation.value.data.scenarioB ? dataToHeatmapData(simulation.value.data.scenarioB) : [];
    case 'difference':
      return simulation.value.data.difference ? dataToHeatmapData(simulation.value.data.difference) : [];
  }
});

const graphAxes = computed<GraphAxes>(() => getGraphAxesForPlane(props.planeSlug));

const expectedValueRange = computed<ExpectedValueRange>(() => {
  if (!variableAttributes.value) return { min: 0, max: 100 };
  
  return getExpectedValueRangeForVariable(variableAttributes.value, mode.value === 'difference');
});

const graphAspectRatio = computed(() => {
  return (graphAxes.value.x.max * graphAxes.value.x.cellSize) / (graphAxes.value.y.max * graphAxes.value.y.cellSize);
});
</script>

<template>
  <div v-if="simulation && variableAttributes" class="pa-8">
    <h2>{{ variableAttributes.long_name }} ({{ variableAttributes.units }})</h2>
    <v-btn-toggle v-if="scenarioBSlug" v-model="mode" color="primary" mandatory density="comfortable">
      <v-btn value="scenarioA">Scenario A ({{ scenarioASlug }})</v-btn>
      <v-btn value="scenarioB">Scenario B ({{ scenarioBSlug }})</v-btn>
      <v-btn value="difference">Signed difference (A - B)</v-btn>
    </v-btn-toggle>

    <div class="heatmap-container" :style="`aspect-ratio: ${graphAspectRatio}`">
      <matrix-heatmap v-if="simulation" :axisX="graphAxes.x" :axisY="graphAxes.y" :expected-value-range="expectedValueRange" :data="heatmapData" />
    </div>
  </div>
  <div v-else>
    <v-skeleton-loader type="card"></v-skeleton-loader>
  </div>
</template>

<style scoped>
.heatmap-container {
  min-height: 500px;
  max-height: 80vh;
  max-width: 100%;
}
</style>