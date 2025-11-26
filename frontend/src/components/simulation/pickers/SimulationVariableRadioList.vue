<script lang="ts" setup>
import {
  useSimulationResultVariablesStore,
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

const model = defineModel()

const simulationResultsVariablesStore = useSimulationResultVariablesStore()
const allVariables = ref<SluggedSimulationResultVariable[]>([])

onMounted(async () => {
  const all = await simulationResultsVariablesStore.getSimulationResultVariablesList()
  allVariables.value = all
})

const groups = computed<SimulationVariableGroup[]>(() => {
  return groupSimulationVariablesByAvailableAt(allVariables.value, {
    availableAt: props.availableAt,
    renameWallAndFacadeToRoof: props.renameWallAndFacadeToRoof,
    putPETandUTCIinCommonGroup: true
  })
})

const openedGroups = ref<number[]>([0])
</script>

<template>
  <v-expansion-panels multiple v-model="openedGroups" flat>
    <v-radio-group v-model="model">
      <v-expansion-panel
        v-for="group in groups"
        :key="group.groupName"
        :disabled="Array.isArray(groups) === false || group.variables.length === 0"
      >
        <v-expansion-panel-title class="group-name">{{ group.groupName }}</v-expansion-panel-title>

        <v-expansion-panel-text>
          <template v-for="variable in group.variables" :key="variable.slug">
            <v-radio :value="variable.slug" density="comfortable" :hide-details="true">
              <template #label>
                <div class="text-body-1 ml-1">
                  <span
                    >{{ variable.long_name }}
                    <span v-if="variable.units">({{ variable.units }})</span></span
                  >
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
