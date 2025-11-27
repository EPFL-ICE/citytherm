<script lang="ts" setup>
import {
  useSimulationResultVariablesStore,
  type VariableAttributes,
  type SluggedSimulationResultVariable
} from '@/stores/simulation/simulationResultVariables'
import { computed, onMounted, ref } from 'vue'
import {
  groupSimulationVariablesByAvailableAt,
  type SimulationVariableGroup
} from './simulationVariablesPickersUtils'

const props = defineProps<{
  availableAt?: number
  renameWallAndFacadeToRoof?: boolean
}>()

const model = defineModel<string[]>()

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
    availableAt: props.availableAt,
    renameWallAndFacadeToRoof: props.renameWallAndFacadeToRoof,
    putPETandUTCIinCommonGroup: true
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
    <v-expansion-panel
      v-for="group in groups"
      :key="group.groupName"
      :disabled="Array.isArray(groups) === false || group.categories.length === 0"
    >
      <v-expansion-panel-title class="group-name">{{ group.groupName }}</v-expansion-panel-title>

      <v-expansion-panel-text>
        <template
          v-for="category in group.categories.filter((category) => !!category.categorySlug)"
          :key="category.categorySlug"
        >
          <div v-if="group.categories.length > 1">
            <v-checkbox
              v-model="model"
              :value="category.categorySlug"
              density="comfortable"
              :hide-details="true"
            >
              <template #label>
                <div class="text-subtitle-1 font-weight-medium ml-1">
                  {{ categoryName(category.categorySlug) }}
                </div>
              </template>
            </v-checkbox>
          </div>
        </template>
      </v-expansion-panel-text>
    </v-expansion-panel>
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
