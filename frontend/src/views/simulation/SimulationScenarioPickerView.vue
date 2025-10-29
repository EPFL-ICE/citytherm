<script setup lang="ts">
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'
import ScenarioPreview from '@/components/simulation/ScenarioPreview.vue'
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import { computed, onMounted, ref } from 'vue'
import {
  getSimulationPlanePresetsForParameters,
  type SimulationPlane,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import { makePathToPlane, makePathToScenarioPickerMerge, type ScenarioPickerParams } from '@/lib/utils/routingUtils'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const scenarioStore = useScenariosStore()

const scenariosSlug = computed(() => (route.query.scenarios as string | undefined ?? "").split(","))
const planeSlug = computed(() => (route.query.plane as SimulationPlanePreset | undefined) ?? "")

const scenariosList = ref<ScenarioDescription[] | null>(null)
onMounted(async () => {
  scenariosList.value = await scenarioStore.getScenarioDescriptions()
})

const availablePlanes = computed<SimulationPlanePresetsMap>(() => {
  const buildingCanopyHeight = scenariosSlug.value.includes('S1') ? 30 : 16
  const midBuildingZ = scenariosSlug.value.includes('S2') ? 25 : 19

  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ)
})

const planesSelectOptions = computed(() => Object.values(availablePlanes.value))

let selectedPlane = computed<SimulationPlane | null>(() => {
  if (!planeSlug.value) return null

  return availablePlanes.value[planeSlug.value].plane
})

function goToUpdatedParams(params: Partial<ScenarioPickerParams>) {
  const routePath = makePathToScenarioPickerMerge(params, {
    scenario: scenariosSlug.value[0] ?? null,
    plane: planeSlug.value ?? null
  })
  router.push(routePath)
}

const planeExplorerUrl = computed(() => {
  if (scenariosSlug.value.length === 0 || !planeSlug.value) return null

  return makePathToPlane({
    scenarioA: scenariosSlug.value[0],
    scenarioB: null,
    plane: planeSlug.value,
    time: 'time_12',
    variables: []
  })
})
</script>

<template>
  <two-panes-layout title="Simulation scenario picker">
    <template #left-pane>
      <v-list
        :selected="scenariosSlug"
        @update:selected="(value) => { goToUpdatedParams({ scenario: (value as string[])[0] ?? undefined }) }"
        two-line
        class="pt-0"
      >
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
          :model-value="planeSlug"
          @update:model-value="(value) => { goToUpdatedParams({ plane: value ?? undefined }) }"
          :items="planesSelectOptions"
          :item-props="
            (item) => ({ title: item.name, subtitle: item.description, value: item.slug })
          "
          label="Select a simulation plane"
          single-line
          :disabled="scenariosSlug.length === 0 || planesSelectOptions.length === 0"
        />
      </div>

      <v-btn color="primary" :disabled="!planeExplorerUrl" :to="planeExplorerUrl!">
        Load Scenario
      </v-btn>
    </template>

    <template #default>
      <scenario-preview
        v-if="scenariosSlug.length > 0"
        :scenarioId="scenariosSlug[0]"
        :plane="selectedPlane"
      />
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">Please select a scenario on the left panel</div>
      </div>
    </template>
  </two-panes-layout>
</template>
