<script setup lang="ts">
import {
  useScenariosStore,
  type ScenarioCollection,
  type ScenarioDescription
} from '@/stores/simulation/scenarios'
import ScenarioPreview from '@/components/simulation/ScenarioPreview.vue'
import TwoPanesLayout from '@/components/ui/TwoPanesLayout.vue'
import { computed, onMounted, ref } from 'vue'
import {
  getSimulationPlanePresetsForParameters,
  type SimulationPlane,
  type SimulationPlanePreset,
  type SimulationPlanePresetsMap
} from '@/lib/simulation/simulationResultPlanesUtils'
import {
  makePathToPlane,
  makePathToScenarioPickerMerge,
  type ScenarioPickerParams
} from '@/lib/utils/routingUtils'
import { useRoute, useRouter } from 'vue-router'
import InfoTooltip from '@/components/InfoTooltip.vue'
import ToolSet from '@/components/ui/ToolSet.vue'

const route = useRoute()
const router = useRouter()
const scenarioStore = useScenariosStore()

const scenariosSlug = computed(
  () => (route.query.scenarios as string | undefined)?.split(',') ?? []
)
const planeSlug = computed(() => (route.query.plane as SimulationPlanePreset | undefined) ?? '')

const scenariosCollection = ref<ScenarioCollection | null>(null)
const openedGroups = ref<number[]>([0, 1])
onMounted(async () => {
  scenariosCollection.value = await scenarioStore.getScenarioDescriptions()
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

function getTooltipContent(scenario: ScenarioDescription): string {
  return `${scenario.description}\n\n<b>Primary Analysis focus :</b>\n${scenario.primaryAnalysisFocus}}`
}
</script>

<template>
  <two-panes-layout title="Simulation Scenarios" :disable-left-pane-padding="true">
    <template #left-pane>
      <tool-set>
        <template #default>
          <v-expansion-panels multiple v-model="openedGroups">
            <v-list
              :selected="scenariosSlug"
              @update:selected="
                (value) => {
                  goToUpdatedParams({ scenario: (value as string[])[0] ?? undefined })
                }
              "
              two-line
              class="pt-0 w-100"
            >
              <v-expansion-panel
                v-for="(group, index) in Object.values(scenariosCollection?.groups || {})"
                :key="index"
              >
                <v-expansion-panel-title class="group-name">{{
                  group.groupName
                }}</v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-list-item
                    v-for="scenario in group.scenarios.map(
                      (slug) => scenariosCollection!.scenarios[slug]
                    )"
                    :key="scenario.id"
                    :value="scenario.slug"
                    :title="`${scenario.id} - ${scenario.name}`"
                  >
                    <template #append>
                      <info-tooltip :content="getTooltipContent(scenario)" />
                    </template>
                  </v-list-item>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-list>
          </v-expansion-panels>
        </template>

        <template #footer>
          <div class="pa-4">
            <v-select
              :model-value="planeSlug"
              @update:model-value="
                (value) => {
                  goToUpdatedParams({ plane: value ?? undefined })
                }
              "
              :items="planesSelectOptions"
              :item-props="
                (item) => ({ title: item.name, subtitle: item.description, value: item.slug })
              "
              label="Select a simulation plane"
              single-line
              :disabled="scenariosSlug.length === 0 || planesSelectOptions.length === 0"
            />
            <v-btn
              class="w-100"
              color="primary"
              :disabled="!planeExplorerUrl"
              :to="planeExplorerUrl!"
            >
              Load Scenario
            </v-btn>
          </div>
        </template>
      </tool-set>
    </template>

    <template #default>
      <scenario-preview
        v-if="scenariosSlug.length > 0 && scenariosSlug[0] !== null"
        :scenarioId="scenariosSlug[0]"
        :plane="selectedPlane"
      />
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">Please select a scenario on the left panel</div>
      </div>
    </template>
  </two-panes-layout>
</template>

<style scoped>
.group-name {
  font-weight: 500;
  font-size: 1.25em;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 0.5rem 0.5rem 0.5rem;
}
</style>
