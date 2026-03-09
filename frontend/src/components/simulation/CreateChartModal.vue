<script setup lang="ts">
import ChartDesignerStepper from './ChartDesignerStepper.vue';
import { mdiClose, mdiPlus } from '@mdi/js';
import type { GraphKindDescription } from './pickers/graphKindPickerUtils';
import type { SimulationPlanePreset } from '@/lib/simulation/simulationResultPlanesUtils';
import { ref, watch } from 'vue';

const open = defineModel({ default: false })

const selectedGraphKind = ref<GraphKindDescription | null>(null)
const scenarios = ref<string[]>([])
const plane = ref<SimulationPlanePreset | null>(null)
const point = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'create', payload: { graphKind: GraphKindDescription; scenarios: string[]; plane: SimulationPlanePreset | null; point: string | null }): void
}>()

function handleCreate() {
  if (!selectedGraphKind.value) return;

  emit('create', {
    graphKind: selectedGraphKind.value,
    scenarios: scenarios.value,
    plane: plane.value,
    point: point.value
  })

  open.value = false;
}

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    selectedGraphKind.value = null
    scenarios.value = []
    plane.value = null
    point.value = null
  }
})
</script>

<template>
  <v-dialog
    v-model="open"
    transition="dialog-bottom-transition"
    fullscreen
    scrollable
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="primary"
        :append-icon="mdiPlus"
        text="New Graph"
        variant="flat"
        size="large"
        class="ml-auto mr-1"
      ></v-btn>
    </template>

    <v-card>
      <v-card-text class="pa-0" style="height: 90vh;">
        <chart-designer-stepper
          v-model:graphKind="selectedGraphKind"
          v-model:scenarios="scenarios"
          v-model:plane="plane"
          v-model:point="point"
          @create="handleCreate"
        >
          <template #header-left>
            <v-btn
              :icon="mdiClose"
              @click="open = false"
              class="ml-4"
            ></v-btn>
            <div class="text-h6 pa-4 title">Create a new graph</div>
          </template>
        </chart-designer-stepper>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>

.title {
  min-width: 15rem;
}

</style>