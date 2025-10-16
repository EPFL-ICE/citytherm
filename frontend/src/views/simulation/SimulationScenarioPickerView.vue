<script setup lang="ts">
import { useScenariosStore, type ScenarioDescription } from '@/stores/scenarios'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { getSimulationPlanePresetsForParameters, type SimulationPlane, type SimulationPlanePreset, type SimulationPlanePresetsMap } from '@/lib/simulation/simulationResultPlanesUtils'

const scenariosList = ref<ScenarioDescription[] | null>(null);

const scenarioStore = useScenariosStore();

onMounted(async () => {
  scenariosList.value = await scenarioStore.getScenarioDescriptions();
})

let selectedScenariosSlug = ref<string[]>([]);

const availablePlanes = computed<SimulationPlanePresetsMap>(() => {
  const buildingCanopyHeight = selectedScenariosSlug.value.includes('S1_1') ? 30 : 16;
  const midBuildingZ = selectedScenariosSlug.value.includes('S1_2') ? 25 : 19;
  
  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ);
})

const planesSelectOptions = computed(() => Object.values(availablePlanes.value));

let selectedPlaneSlug = ref<SimulationPlanePreset | null>(null);
let selectedPlane = computed<SimulationPlane | null>(() => {
  if (!selectedPlaneSlug.value) return null;

  return availablePlanes.value[selectedPlaneSlug.value].plane;
});
</script>

<template>
  <two-panes-layout title="Simulation scenario picker">
    <template #left-pane>
      <v-list two-line v-model:selected="selectedScenariosSlug" class="pt-0">
        <v-list-item
          v-for="scenario in scenariosList"
          :key="scenario.id"
          :value="scenario.slug"
          :title="`${scenario.id} - ${scenario.scenario}`"
          :subtitle="scenario.description"
        />
      </v-list>

      <div>
        <v-select
          v-model="selectedPlaneSlug"
          :items="planesSelectOptions"
          :item-props="(item) => ({ title: item.name, subtitle: item.description, value: item.slug })"
          label="Select a simulation plane"
          single-line
          :disabled="!selectedPlaneSlug || selectedScenariosSlug.length === 0"
        />
      </div>

      <v-btn color="primary" :disabled="!selectedScenariosSlug"> Load Scenario </v-btn>
    </template>

    <template #default>
      <scenario-preview
        v-if="selectedScenariosSlug.length > 0"
        :scenarioId="selectedScenariosSlug[0]"
        :plane="selectedPlane"
      />
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">Please select a scenario on the left panel</div>
      </div>
    </template>
  </two-panes-layout>
</template>
