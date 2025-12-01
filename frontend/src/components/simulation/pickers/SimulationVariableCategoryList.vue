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
  availableAt?: number | number[]
  omitGroups?: string[]
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
  console.log(variableAttributes.value?.categories)
  if (!variableAttributes.value || !categorySlug) return 'Uncategorized'
  return variableAttributes.value.categories[categorySlug]?.name || 'Uncategorized'
}

function categorySubVariables(categorySlug: string | undefined): string {
  if (!variableAttributes.value || !categorySlug) return ''

  const category = variableAttributes.value.categories[categorySlug]
  return category.variables.map((v) => variableAttributes.value?.variables[v].long_name).join(', ')
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
              class="box-top"
            >
              <template #label>
                <div class="ml-1">
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ categoryName(category.categorySlug) }}
                  </div>
                  <div class="text-caption font-weight-light">
                    {{ categorySubVariables(category.categorySlug) }}
                  </div>
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
