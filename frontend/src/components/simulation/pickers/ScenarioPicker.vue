<script setup lang="ts">
import {
  useScenariosStore,
  type ScenarioCollection,
  type ScenarioDescription
} from '@/stores/simulation/scenarios'
import ScenarioPreview from '@/components/simulation/ScenarioPreview.vue'
import TwoPanesLayoutSimple from '@/components/ui/TwoPanesLayoutSimple.vue'
import ResultGrid from '@/components/ui/ResultGrid.vue'
import InfoTooltip from '@/components/InfoTooltip.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  multiple?: boolean
}>()

const selectedSlugs = defineModel<string[]>({ default: [] })

const scenarioStore = useScenariosStore()
const scenariosCollection = ref<ScenarioCollection | null>(null)

onMounted(async () => {
  scenariosCollection.value = await scenarioStore.getScenarioDescriptions()
})

function handleSelectionUpdate(value: string[]) {
  if (props.multiple) {
    selectedSlugs.value = value
  } else {
    const newItem = value.find((v) => !selectedSlugs.value.includes(v))
    selectedSlugs.value = newItem ? [newItem] : []
  }
}

function getTooltipContent(scenario: ScenarioDescription): string {
  return `${scenario.description}\n\n<b>Primary Analysis focus :</b>\n${scenario.primaryAnalysisFocus}`
}
</script>

<template>
  <two-panes-layout-simple title="Pick a scenario" :disable-left-pane-padding="true">
    <template #left-pane>
      <tool-set>
        <v-list
          :selected="selectedSlugs"
          :select-strategy="props.multiple ? 'leaf' : 'single-leaf'"
          @update:selected="handleSelectionUpdate"
          open-strategy="multiple"
          two-line
          class="pt-0 w-100"
        >
          <v-list-group
            v-for="(group, index) in Object.values(
              scenariosCollection?.groups || {}
            )"
            :key="index"
            :value="index"
          >
            <template #activator="{ props: groupProps }">
              <v-list-item
                v-bind="groupProps"
                :title="group.groupName"
                class="group-name"
              />
            </template>

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
          </v-list-group>
        </v-list>
      </tool-set>
    </template>

    <template #default>
      <template v-if="selectedSlugs.length > 0">
        <result-grid
          :numColumns="Math.min(2, selectedSlugs.length)"
        >
          <scenario-preview
            v-for="slug in selectedSlugs"
            :key="slug"
            :scenarioId="slug"
            :plane="null"
          />
        </result-grid>
      </template>
      <div class="d-flex h-100 align-center justify-center" v-else>
        <div class="text-h4">Please select a scenario on the left panel</div>
      </div>
    </template>
  </two-panes-layout-simple>
</template>

<style scoped>
.group-name {
  font-weight: 500;
  font-size: 1.25em;
}
</style>