<script setup lang="ts">
import {
  useScenariosStore,
  type ScenarioCollection,
  type ScenarioDescription
} from '@/stores/simulation/scenarios'
import { computed, onMounted, ref } from 'vue'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  label: string
}>()
const model = defineModel<string[]>()

const scenariosCollection = ref<ScenarioCollection | null>(null)

onMounted(async () => {
  scenariosCollection.value = await scenarioStore.getScenarioDescriptions()
})

function scenarioItemProps(item: ScenarioDescription | null) {
  if (!item) return { title: 'No comparison', subtitle: 'Pick a scenario to compare', value: null }
  return { title: `${item.id} - ${item.name}`, subtitle: item.description, value: item.slug }
}

interface AutocompleteValueItem {
  title: string
  value: string
  scenario: ScenarioDescription
}

type AutocompleteItem =
  | {
      type: 'subheader'
      title: string
    }
  | AutocompleteValueItem

const items = computed(() => {
  if (!scenariosCollection.value) return []

  const listItems: AutocompleteItem[] = []
  for (const group of Object.values(scenariosCollection.value.groups)) {
    listItems.push({
      type: 'subheader',
      title: group.groupName
    })

    listItems.push(
      ...group.scenarios.map((slug) => {
        const scenario = scenariosCollection.value?.scenarios[slug]!
        return {
          title: `${scenario.id} - ${scenario.name}`,
          value: scenario.slug,
          scenario
        }
      })
    )
  }

  return listItems
})
</script>

<template>
  <v-autocomplete
    :label="label"
    :items="items"
    v-model="model"
    multiple
    chips
    closable-chips
    hide-details
    class="mb-2"
  >
    <template v-slot:subheader="{ props }">
      <v-list-subheader class="font-weight-bold bg-primary">{{ props.title }}</v-list-subheader>
    </template>

    <template v-slot:chip="{ props, item }">
      <v-chip
        v-bind="props"
        :text="`${items.length > 0 ? (item.raw as AutocompleteValueItem).scenario.id : 'Loading...'}`"
      ></v-chip>
    </template>
  </v-autocomplete>
</template>
