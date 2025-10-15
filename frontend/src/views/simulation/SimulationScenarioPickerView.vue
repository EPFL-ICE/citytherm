<script setup lang="ts">
import { useScenariosStore, type ScenarioDescription } from '@/stores/scenarios'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import { computed, onMounted, ref, shallowRef } from 'vue'

const scenariosList = ref<ScenarioDescription[] | null>(null);

const scenarioStore = useScenariosStore();

onMounted(async () => {
  scenariosList.value = await scenarioStore.getScenarioDescriptions();
});

let selectedScenariosSlug = ref<string[]>([]);

interface SimulationPlane {
  rotationX: number; // in radians
  position: { x?: number; y?: number; z?: number };
}

interface SimulationPlaneOption {
  name: string;
  description: string;
  plane: SimulationPlane;
}

type SimulationPlanePreset = "Horizontal_Ground" | "Horizontal_HumanHeight" | "Horizontal_BuildingCanopy" | "Vertical_MidCanyon" | "Vertical_MidBuilding";
const availablePlanes = computed<{ [key in SimulationPlanePreset]: SimulationPlaneOption }>(() => {
  const buildingCaanopyHeight = selectedScenariosSlug.value.includes("S1_1") ? 30 : 16;
  return {
    "Horizontal_Ground": {
      name: "Horizontal - Ground",
      description: "A horizontal plane at ground level (0.2m), useful for assessing surface temperatures.",
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 0.2, z: 0 } }
    },
    "Horizontal_HumanHeight": {
      name: "Horizontal - Human Height",
      description: "A horizontal plane at approximately 1.4 meters above ground, representing human height.",
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 1.4, z: 0 } }
    },
    "Horizontal_BuildingCanopy": {
      name: "Horizontal - Building Canopy",
      description: `A horizontal plane one meter above the average building height (${buildingCaanopyHeight + 1}m).`,
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: buildingCaanopyHeight + 1, z: 0 } }
    },
    "Vertical_MidCanyon": {
      name: "Vertical - Mid Street Canyon",
      description: "A vertical plane cutting through the middle of a street canyon.",
      plane: { rotationX: 0, position: { x: 0, y: 0, z: 0 } }
    },
    "Vertical_MidBuilding": {
      name: "Vertical - Mid Building",
      description: "A vertical plane cutting through the middle of a building.",
      plane: { rotationX: 0, position: { x: 0, y: 0, z: 20 } }
    }
  };
});

const planesSelectOptions = computed(() => Object.values(availablePlanes.value));
let selectedPlane = shallowRef<SimulationPlane | null>(null);

</script>

<template>
  <div class="scaffold">
    <v-sheet class="left-bar" elevation="12">
      <v-card class="d-flex flex-column h-100" flat>
        <v-card-text class="d-flex flex-row align-center ga-2">
          <h2>Scenario picker {{ selectedScenariosSlug }}</h2>
        </v-card-text>
        <v-card-text class="d-flex flex-1-1-100 flex-column justify-space-between">
          <v-list two-line v-model:selected="selectedScenariosSlug">
            <v-list-item v-for="scenario in scenariosList" :key="scenario.id" :value="scenario.slug"
              :title="`${scenario.id} - ${scenario.scenario}`" :subtitle="scenario.description" />
          </v-list>

          <div>
            <v-select
              v-model="selectedPlane"
              :items="planesSelectOptions"
              :item-props="(item) => ({ title: item.name, subtitle: item.description, value: item.plane })"
              label="Select a simulation plane"
              single-line
            />
          </div>

          <v-btn color="primary" :disabled="!selectedScenariosSlug">
            Load Scenario
          </v-btn>
        </v-card-text>
      </v-card>
    </v-sheet>
    <div class="preview">
      <scenario-preview
        v-if="selectedScenariosSlug.length > 0"
        :scenarioId="selectedScenariosSlug[0]"
        :plane="selectedPlane"
      />
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">Please select a scenario on the left panel</div>
      </div>
    </div>
  </div>
</template>

<style>
.scaffold {
  --left-bar-width: min(max(300px, 25vw), 400px);
  display: grid;
  grid-template-areas:
    "left-bar preview";
  grid-template-columns: var(--left-bar-width) calc(100vw - var(--left-bar-width));
  grid-template-rows: 1fr;
}

.left-bar {
  grid-area: left-bar;
  height: 100dvh;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.preview {
  grid-area: preview;
  height: 100dvh;
  position: relative;
}
</style>