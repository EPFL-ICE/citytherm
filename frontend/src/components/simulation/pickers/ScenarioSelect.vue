<script setup lang="ts">
import { useScenariosStore, type ScenarioDescription } from '@/stores/simulation/scenarios'
import { computed, onMounted, ref } from 'vue'

const scenarioStore = useScenariosStore()
const props = defineProps<{
  label: string
  compareOption?: boolean
}>()
const model = defineModel<string | null>()

const scenariosList = ref<ScenarioDescription[] | null>(null)

onMounted(async () => {
  scenariosList.value = await scenarioStore.getScenarioDescriptions()
})

function scenarioItemProps(item: ScenarioDescription | null) {
  if (!item) return { title: 'No comparison', subtitle: 'Pick a scenario to compare', value: null }
  return { title: `${item.id} - ${item.scenario}`, subtitle: item.description, value: item.slug }
}

const items = computed(() => {
  if (!scenariosList.value) return []

  if (props.compareOption) {
    return [null, ...scenariosList.value]
  }

  return scenariosList.value
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
