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
const selectedVariables = computed(() => {
  if (!model.value || !variableAttributes.value) {
    return []
  }
  return variableAttributes.value.variables
    ? Object.keys(variableAttributes.value.variables).filter((slug) => model.value!.includes(slug))
    : []
})

defineExpose({
  selectedVariables
})

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

function numberOfCheckedInCategoryInModel(variables: SluggedSimulationResultVariable[]): number {
  if (!model.value) {
    return 0
  }
  let numberIncluded = 0
  for (const variable of variables) {
    if (model.value.includes(variable.slug)) {
      numberIncluded += 1
    }
  }
  return numberIncluded
}

function toggleFullCategoryInModel(
  variables: SluggedSimulationResultVariable[],
  isChecked: boolean
): void {
  if (!model.value) return

  const slugs = variables.map((v) => v.slug)
  if (isChecked) {
    model.value = [...new Set([...model.value, ...slugs])]
  } else {
    model.value = model.value.filter((slug) => !slugs.includes(slug))
  }
}

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
        <template v-for="category in group.categories" :key="category.categorySlug">
          <div class="mb-4">
            <div v-if="group.categories.length > 1">
              <v-checkbox
                :model-value="
                  numberOfCheckedInCategoryInModel(category.variables) === category.variables.length
                "
                :indeterminate="
                  numberOfCheckedInCategoryInModel(category.variables) > 0 &&
                  numberOfCheckedInCategoryInModel(category.variables) < category.variables.length
                "
                @update:model-value="
                  (value) => toggleFullCategoryInModel(category.variables, !!value)
                "
                density="compact"
                :hide-details="true"
              >
                <template #label>
                  <div class="text-subtitle-1 font-weight-medium ml-1">
                    {{ categoryName(category.categorySlug) }}
                  </div>
                </template>
              </v-checkbox>
            </div>
            <template v-for="variable in category.variables" :key="variable.slug">
              <div class="ml-3">
                <v-checkbox
                  v-model="model"
                  :value="variable.slug"
                  density="compact"
                  :hide-details="true"
                >
                  <template #label>
                    <div class="text-body-1 ml-1">
                      <span>
                        {{ variable.long_name }}
                        <span v-if="variable.units">({{ variable.units }})</span>
                      </span>
                    </div>
                  </template>
                </v-checkbox>
              </div>
            </template>
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
