<script setup lang="ts">
import ScenarioPreview from '@/components/simulation/ScenarioPreview.vue'
import TwoPanesLayoutSimple from '@/components/ui/TwoPanesLayoutSimple.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import {
  getSimulationPresetsForScenarioSlug,
  type SimulationPlane,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import { computed } from 'vue'

const props = defineProps<{
  scenarioSlugs: string[]
}>()

const selectedPlaneSlug = defineModel<SimulationPlanePreset | null>({ default: null })

const availablePlanes = computed<SimulationPlanePresetsMap>(() =>
  getSimulationPresetsForScenarioSlug(props.scenarioSlugs[0] || '')
)

const planeItems = computed(() => Object.values(availablePlanes.value))

function selectedPlaneForScenario(slug: string): SimulationPlane | null {
  if (!selectedPlaneSlug.value) return null
  const planesForScenario = getSimulationPresetsForScenarioSlug(slug)
  return planesForScenario[selectedPlaneSlug.value]?.plane ?? null
}

function handleSelectionUpdate(value: SimulationPlanePreset[]) {
  const newItem = value.find((v) => v !== selectedPlaneSlug.value)
  selectedPlaneSlug.value = newItem ?? null
}
</script>

<template>
  <two-panes-layout-simple title="Pick a plane" :disable-left-pane-padding="true">
    <template #left-pane>
      <tool-set>
        <v-list
          :selected="selectedPlaneSlug ? [selectedPlaneSlug] : []"
          :disabled="scenarioSlugs.length === 0"
          @update:selected="handleSelectionUpdate"
          class="pt-0 w-100"
        >
          <v-list-item
            v-for="plane in planeItems"
            :key="plane.slug"
            :value="plane.slug"
            :title="plane.name"
            :subtitle="plane.description"
          />
        </v-list>
      </tool-set>
    </template>

    <template #default>
      <template v-if="scenarioSlugs.length > 0">
        <result-grid :numColumns="Math.min(2, scenarioSlugs.length)">
          <scenario-preview
            v-for="slug in scenarioSlugs"
            :key="slug"
            :scenarioId="slug"
            :plane="selectedPlaneForScenario(slug)"
          />
        </result-grid>
      </template>
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">
          {{
            scenarioSlugs.length === 0
              ? 'Please select a scenario first'
              : 'Please select a plane on the left panel'
          }}
        </div>
      </div>
    </template>
  </two-panes-layout-simple>
</template>
