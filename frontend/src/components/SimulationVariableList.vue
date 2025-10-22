<script lang="ts" setup>
import { useSimulationResultVariablesStore, type SluggedSimulationResultVariable } from '@/stores/simulationResultVariables';
import { onMounted, ref } from 'vue';

const model = defineModel();

const simulationResultsVariablesStore = useSimulationResultVariablesStore();
const simulationResultsVariables = ref<SluggedSimulationResultVariable[]>([]);

onMounted(async () => {
  simulationResultsVariables.value = await simulationResultsVariablesStore.getSimulationResultVariablesList();
});
</script>

<template>
  <template v-for="variable in simulationResultsVariables" :key="variable.slug">
    <v-checkbox v-model="model" :value="variable.slug" density="comfortable" :hide-details="true">
      <template #label>
        <div class="text-body-1 ml-1">{{ variable.long_name }} ({{ variable.units }})</div>
      </template>
    </v-checkbox>
  </template>
</template>