import {
  graphKindsDescriptions,
  type GraphKind
} from '@/components/simulation/pickers/graphKindPickerUtils'
import {
  getSimulationPresetsForScenarioSlug,
  type SimulationPlanePreset
} from '@/lib/simulation/simulationResultPlanesUtils'
import { defineStore } from 'pinia'
import { AsyncResult } from 'unwrapped/core'
import { ref } from 'vue'
import { useScenariosStore } from './scenarios'

export interface GraphDesign {
  id: string
  name: string
  description: string
  graphKindSlug: GraphKind
  scenarios: string[]
  plane: SimulationPlanePreset | null
  point: string | null
  time: string | null
  variables: string[]
}

type GraphDesignCollection = Record<string, GraphDesign>

export interface CreateGraphDesignInput {
  graphKindSlug: GraphKind
  scenarios: string[]
  plane: SimulationPlanePreset | null
  point: string | null
}

export const useGraphsStore = defineStore('graphs', () => {
  const scenariosStore = useScenariosStore()

  const graphs = ref<GraphDesignCollection>({})

  function createGraph(input: CreateGraphDesignInput): AsyncResult<GraphDesign> {
    return AsyncResult.run(function* () {
      const scenarios = yield* scenariosStore.scenarios

      const scenarioNames = input.scenarios
        .map((slug) => {
          const s = scenarios.scenarios[slug]
          if (!s) return slug
          return `${s?.id} - ${s?.name}`
        })
        .join(', ')

      let location = 'no plane/point'
      if (input.plane) {
        location = getSimulationPresetsForScenarioSlug(input.scenarios[0])[input.plane].name
      } else if (input.point) {
        const available = yield* AsyncResult.fromValuePromise(
          scenariosStore.getAvailableTimeSeriesPointsForScenario(input.scenarios[0])
        )
        location = available.find((p) => p.s === input.point)?.n ?? input.point
      }

      const id = `graph-${Date.now()}`
      const design: GraphDesign = {
        id,
        name: `${
          graphKindsDescriptions[input.graphKindSlug].shortName
        } | ${scenarioNames} | ${location}`,
        description: '',
        time: 'time_12',
        variables: [],
        ...input
      }
      graphs.value[id] = design
      return design
    })
  }

  return {
    graphs,
    createDesign: createGraph
  }
})
