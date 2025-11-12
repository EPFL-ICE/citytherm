import { getMinMaxAcrossMultipleScenarios } from '@/components/simulation/heatmap/heatmapUtils'
import { cdnUrl } from '@/config/layerTypes'
import { KeyedCache, makeCompositeKey, parseCompositeKey } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type SimulationResultPlaneAtomicData = (number | null)[][]

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
      const va = a[i][j]
      const vb = b[i][j]

      if (va === null || va === undefined || vb === null || vb === undefined) {
        diff[i][j] = null
      } else {
        diff[i][j] = va - vb
      }
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
    `${cdnUrl}/simulation/scenarios/${scenarioSlug}/${variableSlug}/${timeSliceSlug}/${planeSlug}.json`
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
  return makeCompositeKey([scenarioSlug, planeSlug, timeSliceSlug, variableSlug])
}

function makeSlugForComparisonScenario(
  scenarioASlug: string,
  scenarioBSlug: string | null,
  planeSlug: string,
  timeSliceSlug: string,
  variableSlug: string
): string {
  return makeCompositeKey([scenarioASlug, scenarioBSlug, planeSlug, timeSliceSlug, variableSlug])
}

// key is in the form `${scenarioSlug};${planeSlug};${timeSliceSlug};${variableSlug}`
async function fetchSimulationResultPlaneData(key: string): Promise<SimulationResultPlaneData> {
  const [scenarioASlug, planeSlug, timeSliceSlug, variableSlug] = parseCompositeKey(key)
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
    // key is in the form `${scenarioASlug};${scenarioBSlug};${planeSlug};${timeSliceSlug};${variableSlug}`
    async (key: string) => {
      const [scenarioASlug, scenarioBSlug, planeSlug, timeSliceSlug, variableSlug] =
        parseCompositeKey(key)

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
        ? getDifferenceData(scenarioBData.data, scenarioAData.data) // b - a so that it's positive when scenarioB > scenarioA
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

  async function getPlaneDataForScenario(
    scenarioSlug: string,
    planeSlug: string,
    timeSliceSlug: string,
    variableSlug: string
  ): Promise<SimulationResultPlaneData> {
    return scenarioDataCache.get(
      makeSlugForSingleScenario(scenarioSlug, planeSlug, timeSliceSlug, variableSlug)
    )
  }

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
        planeSlug,
        timeSliceSlug,
        variableSlug
      )
    )
  }

  async function getMinMaxForMultipleScenariosSlugs(
    scenarioSlugs: string[],
    planeSlug: string,
    timeSliceSlug: string,
    variableSlug: string
  ): Promise<{ min: number; max: number }> {
    const allData: SimulationResultPlaneAtomicData[] = await Promise.all(
      scenarioSlugs.map((scenarioSlug) =>
        getPlaneDataForScenario(scenarioSlug, planeSlug, timeSliceSlug, variableSlug).then(
          (res) => res.data
        )
      )
    )

    return getMinMaxAcrossMultipleScenarios(allData)
  }

  return {
    getPlaneDataForScenario,
    getSimulationResultPlane,
    getMinMaxForMultipleScenariosSlugs
  }
})
