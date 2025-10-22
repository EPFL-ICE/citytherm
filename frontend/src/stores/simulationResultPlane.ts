import { KeyedCache } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type SimulationResultPlaneAtomicData = number[][]

export type SimulationResultPlaneData = {
  data: SimulationResultPlaneAtomicData
}

export interface SimulationResultPlaneValues {
  axisX: {
    name: string
    max: number
  }
  axisY: {
    name: string
    max: number
  }
  data: {
    scenarioA: SimulationResultPlaneAtomicData
    scenarioB?: SimulationResultPlaneAtomicData | null
    difference?: SimulationResultPlaneAtomicData | null
  }
}

function getDifferenceData(
  a: SimulationResultPlaneAtomicData,
  b: SimulationResultPlaneAtomicData
): SimulationResultPlaneAtomicData {
  const w = a.length
  const h = a[0].length
  const diff: SimulationResultPlaneAtomicData = []
  for (let i = 0; i < w; i++) {
    diff[i] = []
    for (let j = 0; j < h; j++) {
      diff[i][j] = a[i][j] - b[i][j]
    }
  }
  return diff
}

async function fetchSimulationResultForScenarioPlaneTimeAndVariable(
  scenarioSlug: string,
  planeSlug: string,
  timeSliceSlug: string,
  variableSlug: string
): Promise<SimulationResultPlaneData> {
  const response = await fetch(
    `/simulation/scenarios/${scenarioSlug}/${variableSlug}/${timeSliceSlug}/${planeSlug}.json`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch simulation result: ${response.statusText}`)
  }
  return response.json()
}

function makeSlugForSingleScenario(
  scenarioSlug: string,
  planeSlug: string,
  timeSliceSlug: string,
  variableSlug: string
): string {
  return `${scenarioSlug}-${planeSlug}-${timeSliceSlug}-${variableSlug}`
}

function makeSlugForComparisonScenario(
  scenarioASlug: string,
  scenarioBSlug: string | null,
  planeSlug: string,
  timeSliceSlug: string,
  variableSlug: string
): string {
  return `${scenarioASlug}-${scenarioBSlug ?? '_'}-${planeSlug}-${timeSliceSlug}-${variableSlug}`
}

// key is in the form `${scenarioSlug}-${variableSlug}-${timeSliceSlug}-${planeSlug}`
async function fetchSimulationResultPlaneData(key: string): Promise<SimulationResultPlaneData> {
  const [scenarioASlug, variableSlug, timeSliceSlug, planeSlug] = key
    .split('-')
    .map((s) => (s === '_' || s === 'null' ? null : s))
  return fetchSimulationResultForScenarioPlaneTimeAndVariable(
    scenarioASlug!,
    planeSlug!,
    timeSliceSlug!,
    variableSlug!
  )
}

export const useSimulationResultPlaneStore = defineStore('simulationResultPlane', () => {
  const scenarioDataCache = new KeyedCache<SimulationResultPlaneData, Error>(
    fetchSimulationResultPlaneData
  )

  const simulationResultPlaneCache = new KeyedCache<SimulationResultPlaneValues, Error>(
    // key is in the form `${scenarioASlug}-${scenarioBSlug}-${variableSlug}-${timeSliceSlug}-${planeSlug}`
    async (key: string) => {
      const [scenarioASlug, scenarioBSlug, variableSlug, timeSliceSlug, planeSlug] = key
        .split('-')
        .map((s) => (s === '_' || s === 'null' ? null : s))

      const [scenarioAData, scenarioBData] = await Promise.all([
        scenarioDataCache.get(
          makeSlugForSingleScenario(scenarioASlug!, planeSlug!, timeSliceSlug!, variableSlug!)
        ),
        scenarioBSlug
          ? scenarioDataCache.get(
              makeSlugForSingleScenario(scenarioBSlug, planeSlug!, timeSliceSlug!, variableSlug!)
            )
          : null
      ])

      const differenceData = scenarioBData
        ? getDifferenceData(scenarioAData.data, scenarioBData.data)
        : null

      return {
        axisX: { name: 'X Axis', max: 100 },
        axisY: { name: 'Y Axis', max: 100 },
        data: {
          scenarioA: scenarioAData.data,
          scenarioB: scenarioBData?.data ?? null,
          difference: differenceData
        }
      }
    }
  )

  async function getSimulationResultPlane(
    scenarioASlug: string,
    scenarioBSlug: string | null,
    planeSlug: string,
    timeSliceSlug: string,
    variableSlug: string
  ): Promise<SimulationResultPlaneValues> {
    return simulationResultPlaneCache.get(
      makeSlugForComparisonScenario(
        scenarioASlug,
        scenarioBSlug,
        variableSlug,
        timeSliceSlug,
        planeSlug
      )
    )
  }

  return {
    getSimulationResultPlane
  }
})
