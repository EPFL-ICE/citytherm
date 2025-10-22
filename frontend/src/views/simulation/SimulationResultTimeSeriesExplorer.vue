<script setup lang="ts">
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import ToolSet from '@/components/ToolSet.vue'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SimulationVariableList from '@/components/SimulationVariableList.vue'
import SimulationResultTimeSeriesChart from '@/components/SimulationResultTimeSeriesChart.vue'

const route = useRoute()

const scenarioASlug = computed(() => route.params.scenarioA as string)
const scenarioBSlug = computed(() =>
  route.params.scenarioB === '_' ? null : (route.params.scenarioB as string)
)
const pointSlug = computed(() => route.params.point as string)

const selectedVariables = shallowRef<string[]>([])
</script>

<template>
  <two-panes-layout title="Simulation result time series explorer">
    <template #left-pane>
      <tool-set>
        <template #default>
          <div>
            <simulation-variable-list v-model="selectedVariables" />
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <div v-for="variable in selectedVariables" :key="variable">
        <simulation-result-time-series-chart
          :scenario-a-slug="scenarioASlug"
          :scenario-b-slug="scenarioBSlug"
          :point-slug="pointSlug"
          :variable-slug="variable"
        />
      </div>
    </template>
  </two-panes-layout>
</template>
