<script setup lang="ts">
import { useScenariosStore, type Scenario } from '@/stores/scenarios'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import { ref } from 'vue'

const scenarioStore = useScenariosStore()

const firstScenario = ref<Scenario | null>(null)
scenarioStore
  .getScenario('S0_Baseline_Scenario')
  .then((scenario) => {
    console.log('Fetched scenario:', scenario)
    firstScenario.value = scenario
  })
  .catch((err) => {
    console.error('Error fetching scenario:', err)
  })
</script>

<template>
  <v-container class="fill-height pa-0 overflow-hidden" fluid>
    <v-row class="fill-height overflow-y-hidden">
      <v-col xl="2" cols="3" class="params-col border-e-md overflow-y-auto overflow-x-hidden">
        <v-card>
          <v-card-text class="d-flex flex-row align-center ga-2">
            <h2>Scenario picker</h2>
          </v-card-text>
          <v-card-text class="d-flex flex-column">
            <!-- Use the updated LayerGroups component -->
            List of scenarios to pick from
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <div v-if="firstScenario" style="height: 100%">
          <scenario-preview :scenario="firstScenario"></scenario-preview>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
