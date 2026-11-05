<script setup lang="ts">
import type { GraphDesign } from '@/stores/simulation/graphs'
import { computed } from 'vue'
import { graphKindsDescriptions } from '../pickers/graphKindPickerUtils'
import { mdiCity, mdiLayers, mdiVectorPoint } from '@mdi/js'
import { makeAsyncResultLoader, useReactiveGenerator } from 'unwrapped/vue'
import {
  useScenariosStore,
  ScenarioDescriptionsLoader,
  type ScenarioDescription,
  type TimeSeriesPoint
} from '@/stores/simulation/scenarios'
import { AsyncResult } from 'unwrapped/core'
import { getSimulationPresetsForScenarioSlug } from '@/lib/simulation/simulationResultPlanesUtils'

const scenarioStore = useScenariosStore()

const props = defineProps<{
  graph: GraphDesign
}>()

const kindDescription = computed(() => {
  return graphKindsDescriptions[props.graph.graphKindSlug]
})

const scenarios = useReactiveGenerator(
  () => props.graph.scenarios,
  function* () {
    const scenarios = yield* scenarioStore.scenarios
    return props.graph.scenarios.map((scenarioSlug) => scenarios.scenarios[scenarioSlug])
  }
)

const plane = computed(() => {
  if (!props.graph.plane) return null
  return getSimulationPresetsForScenarioSlug(props.graph.scenarios[0])[props.graph.plane]
})

const point = useReactiveGenerator(
  () => props.graph.point,
  function* () {
    if (!props.graph.point) return null
    const available = yield* AsyncResult.fromValuePromise(
      scenarioStore.getAvailableTimeSeriesPointsForScenario(props.graph.scenarios[0])
    )
    return available.find((p) => p.s === props.graph.point) ?? null
  }
)

const PointLoader = makeAsyncResultLoader<TimeSeriesPoint | null>({})
</script>

<template>
  <div class="mb-4">
    <div class="d-flex align-center">
      <v-icon :icon="kindDescription.icon" class="mr-2" size="x-large" />
      <h5 class="text-h5">{{ kindDescription.shortName }}</h5>
    </div>
    <div>
      <p class="text-body-1">{{ kindDescription.description }}</p>
    </div>
  </div>

  <div class="mb-4">
    <div class="d-flex align-center">
      <v-icon :icon="mdiCity" class="mr-2" size="x-large" />
      <h5 class="text-h5">Scenarios</h5>
    </div>
    <ScenarioDescriptionsLoader :result="scenarios">
      <template #default="{ value: scenarioDescriptions }">
        <div>{{ scenarioDescriptions.map((s) => `${s.id} - ${s.name}`).join(', ') }}</div>
      </template>
    </ScenarioDescriptionsLoader>
  </div>

  <div v-if="plane">
    <div class="d-flex align-center">
      <v-icon :icon="mdiLayers" class="mr-2" size="x-large" />
      <h5 class="text-h5">Plane</h5>
    </div>
    <div>{{ plane.name }}</div>
  </div>
  <div v-else-if="props.graph.point">
    <div class="d-flex align-center">
      <v-icon :icon="mdiVectorPoint" class="mr-2" size="x-large" />
      <h5 class="text-h5">Point</h5>
    </div>
    <PointLoader :result="point">
      <template #default="{ value: pointValue }">
        <div>{{ pointValue?.n ?? 'N/A' }}</div>
      </template>
    </PointLoader>
  </div>
</template>
