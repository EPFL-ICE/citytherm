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
  compareOption?: boolean
}>()
const model = defineModel<string | null>()

const scenariosCollection = ref<ScenarioCollection | null>(null)

onMounted(async () => {
  scenariosCollection.value = await scenarioStore.getScenarioDescriptions()
})

function scenarioItemProps(item: ScenarioDescription | null) {
  if (!item) return { title: 'No comparison', subtitle: 'Pick a scenario to compare', value: null }
  return { title: `${item.id} - ${item.name}`, subtitle: item.description, value: item.slug }
}

const items = computed(() => {
  if (!scenariosCollection.value) return []

  if (props.compareOption) {
    return [null, ...Object.values(scenariosCollection.value.scenarios)]
  }

  return Object.values(scenariosCollection.value.scenarios)
})
</script>

<template>
  <v-select
    v-model="model"
    :items="items"
    :item-props="scenarioItemProps"
    :label="props.label"
    single-line
    :hide-details="true"
    density="comfortable"
    class="mb-2"
  />
</template>
