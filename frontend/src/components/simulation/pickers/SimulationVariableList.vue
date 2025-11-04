<script lang="ts" setup>
import {
  useSimulationResultVariablesStore,
  type SluggedSimulationResultVariable
} from '@/stores/simulation/simulationResultVariables'
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  availableAt?: number
}>()

const model = defineModel()

const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const allVariables = ref<SluggedSimulationResultVariable[]>([])

onMounted(async () => {
  const all = await simulationResultsVariablesStore.getSimulationResultVariablesList()
  allVariables.value = all
})

interface SimulationVariableGroup {
  groupName: string
  variables: SluggedSimulationResultVariable[]
}

const groups = computed<SimulationVariableGroup[]>(() => {
  const commonVariables = allVariables.value.filter((variable) => !variable.available_at)

  if (props.availableAt) {
    const heightVariables = allVariables.value.filter(
      (variable) => variable.available_at === props.availableAt
    )
    return [
      {
        groupName: 'Atmospheric data',
        variables: commonVariables
      },
      {
        groupName: `${heightToText(props.availableAt)} variables (${props.availableAt} m)`,
        variables: heightVariables
      }
    ]
  }

  return [
    {
      groupName: 'Atmospheric data',
      variables: commonVariables
    }
  ]
})

function heightToText(height: number): string {
  if (height <= 0.2) {
    return 'Surface data'
  }
  return ``
}

const openedGroups = ref<number[]>([0])
</script>

<template>
  <v-expansion-panels multiple v-model="openedGroups" flat>
    <v-expansion-panel
      v-for="group in groups"
      :key="group.groupName"
      :disabled="Array.isArray(groups) === false || group.variables.length === 0"
    >
      <v-expansion-panel-title class="group-name">{{ group.groupName }}</v-expansion-panel-title>

      <v-expansion-panel-text>
        <template v-for="variable in group.variables" :key="variable.slug">
          <v-checkbox
            v-model="model"
            :value="variable.slug"
            density="comfortable"
            :hide-details="true"
          >
            <template #label>
              <div class="text-body-1 ml-1">
                <span
                  >{{ variable.long_name }}
                  <span v-if="variable.units">({{ variable.units }})</span></span
                >
              </div>
            </template>
          </v-checkbox>
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
