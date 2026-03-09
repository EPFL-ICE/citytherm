<script lang="ts" setup>
import {
  useSimulationResultVariablesStore,
  type SluggedSimulationResultVariable,
  type VariableAttributes
} from '@/stores/simulation/simulationResultVariables'
import { computed, onMounted, ref } from 'vue'
import {
  groupSimulationVariablesByAvailableAt,
  type SimulationVariableGroup
} from './simulationVariablesPickersUtils'

const props = defineProps<{
  availableAt?: number | number[]
  omitGroups?: string[]
  renameWallAndFacadeToRoof?: boolean
}>()

const model = defineModel()

const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const variableAttributes = ref<VariableAttributes | null>(null)

onMounted(async () => {
  variableAttributes.value = await simulationResultsVariablesStore.getVariableAttributes()
})

const allVariables = computed<SluggedSimulationResultVariable[]>(() => {
  return Object.entries(variableAttributes.value?.variables || {}).map(([slug, variable]) => ({
    slug,
    ...variable
  }))
})

const groups = computed<SimulationVariableGroup[]>(() => {
  return groupSimulationVariablesByAvailableAt(allVariables.value, {
    availableAt: Array.isArray(props.availableAt)
      ? props.availableAt
      : props.availableAt !== undefined
        ? [props.availableAt]
        : undefined,
    renameWallAndFacadeToRoof: props.renameWallAndFacadeToRoof,
    omitGroups: props.omitGroups
  })
})

const openedGroups = ref<number[]>([0])

function categoryName(categorySlug: string | undefined): string {
  if (!variableAttributes.value || !categorySlug) return 'Uncategorized'
  return variableAttributes.value.categories[categorySlug]?.name || 'Uncategorized'
}
</script>

<template>
  <v-expansion-panels multiple v-model="openedGroups" flat>
    <v-radio-group v-model="model">
      <v-expansion-panel
        v-for="group in groups"
        :key="group.groupName"
        :disabled="Array.isArray(groups) === false || group.categories.length === 0"
      >
        <v-expansion-panel-title class="group-name">{{ group.groupName }}</v-expansion-panel-title>

        <v-expansion-panel-text>
          <template v-for="category in group.categories" :key="category.categorySlug">
            <v-radio :value="category.categorySlug" density="comfortable" :hide-details="true">
              <template #label>
                <div class="text-body-1 ml-1">
                  <span>{{ categoryName(category.categorySlug) }}</span>
                </div>
              </template>
            </v-radio>
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-radio-group>
  </v-expansion-panels>
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
