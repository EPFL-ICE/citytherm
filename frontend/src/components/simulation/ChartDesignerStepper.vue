<script setup lang="ts">
import ScenarioPicker from './pickers/ScenarioPicker.vue'
import PlanePicker from './pickers/PlanePicker.vue'
import TimeSeriesPointPicker from './pickers/TimeSeriesPointPicker.vue'
import GraphKindPicker from './pickers/GraphKindPicker.vue'
import { computed, ref } from 'vue'
import type { SimulationPlanePreset } from '@/lib/simulation/simulationResultPlanesUtils'
import type { GraphKindDescription } from './pickers/graphKindPickerUtils'

const selectedGraphKind = defineModel<GraphKindDescription | null>('graphKind', { default: null })
const scenarios = defineModel<string[]>('scenarios', { default: () => [] })
const plane = defineModel<SimulationPlanePreset | null>('plane', { default: null })
const point = defineModel<string | null>('point', { default: null })

const emit = defineEmits<{
  (
    e: 'create',
    payload: {
      graphKind: GraphKindDescription
      scenarios: string[]
      plane: SimulationPlanePreset | null
      point: string | null
    }
  ): void
}>()

const multipleScenarios = computed(() => selectedGraphKind.value?.multipleScenarios ?? false)

const scenarioPickerStepName = computed(() => {
  if (!selectedGraphKind.value) return 'Pick scenario(s)'
  return selectedGraphKind.value.multipleScenarios ? 'Pick scenarios' : 'Pick scenario'
})

const planePointPickerStepName = computed(() => {
  if (!selectedGraphKind.value) return 'Pick plane/point'
  return selectedGraphKind.value.locator === 'plane' ? 'Pick plane' : 'Pick point'
})

const currentStep = ref(1)
const disabled = computed(() => {
  if (currentStep.value === 1) {
    if (!selectedGraphKind.value) return true
    return 'prev'
  }
  if (currentStep.value === 2) {
    if (scenarios.value.length === 0) return 'next'
  }
  if (currentStep.value === 3) {
    if (plane.value === null && point.value === null) return 'next'
  }
  return false
})

const nextText = computed(() => {
  if (currentStep.value === 3) return 'Create'
  return 'Next'
})

function handleNext(next: () => void) {
  if (currentStep.value === 3) {
    emit('create', {
      graphKind: selectedGraphKind.value!,
      scenarios: scenarios.value,
      plane: plane.value,
      point: point.value
    })
  } else {
    next()
  }
}
</script>

<template>
  <v-stepper v-model="currentStep" flat>
    <template v-slot:default="{ next, prev }">
      <v-stepper-header class="header">
        <slot name="header-left"></slot>
        <v-stepper-item
          title="Graph kind"
          :subtitle="selectedGraphKind?.name"
          :value="1"
          :complete="!!selectedGraphKind"
        />

        <v-divider></v-divider>

        <v-stepper-item
          :title="scenarioPickerStepName"
          :subtitle="scenarios.length > 0 ? scenarios.join(', ') : undefined"
          :complete="scenarios.length > 0"
          :value="2"
        />

        <v-divider></v-divider>

        <v-stepper-item :title="planePointPickerStepName" :value="3" />

        <v-stepper-actions
          class="py-0"
          :disabled="disabled"
          :next-text="nextText"
          @click:next="handleNext(next)"
          @click:prev="prev"
          color="primary"
        />
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1">
          <div class="pa-8">
            <h4 class="text-h4 mb-8">Pick a graph kind</h4>
            <graph-kind-picker v-model="selectedGraphKind" />
          </div>
        </v-stepper-window-item>

        <v-stepper-window-item :value="2">
          <scenario-picker v-model="scenarios" :multiple="multipleScenarios" />
        </v-stepper-window-item>

        <v-stepper-window-item :value="3">
          <plane-picker
            v-if="selectedGraphKind?.locator === 'plane'"
            v-model="plane"
            :scenario-slugs="scenarios"
          />
          <time-series-point-picker
            v-else-if="selectedGraphKind?.locator === 'point'"
            v-model="point"
            :scenario-slugs="scenarios"
            :location-realm="selectedGraphKind?.locationRealm"
            :only-closest-to-surface="selectedGraphKind.slug === 'temporal-explore-depth'"
            :hide-height="selectedGraphKind.slug === 'temporal-explore-depth'"
          />
        </v-stepper-window-item>
      </v-stepper-window>
    </template>
  </v-stepper>
</template>

<style scoped>
:deep(.v-stepper-window) {
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  align-items: center;
  z-index: 10;
}
</style>
