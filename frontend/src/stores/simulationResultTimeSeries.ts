import { KeyedCache, makeCompositeKey, parseCompositeKey } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type TimeSeriesDataPoint = {
  t: string
  v: number
}

export type TimeSeriesData = TimeSeriesDataPoint[]

export interface SimulationResultTimeSeriesComparison {
  scenarioA: TimeSeriesData
  scenarioB?: TimeSeriesData | null
  difference?: TimeSeriesData | null
}

async function fetchSimulationResultTimeSeriesForScenarioVariableAndPoint(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): Promise<TimeSeriesData> {
  const response = await fetch(
    `/simulation/scenarios/${scenarioSlug}/${variableSlug}/timeSeries/${pointSlug}.json`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch simulation result: ${response.statusText}`)
  }
  return response.json()
}

function formatPointCoordinate(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString() + '_0'
  }
  return value.toString().replace('.', '_')
}

export function makePointSlug(x: number, y: number, z: number): string {
  return `${formatPointCoordinate(x)}-${formatPointCoordinate(y)}-${formatPointCoordinate(z)}`
}

export function makePointSlugArray(point: [number, number, number]): string {
  return makePointSlug(point[0], point[1], point[2])
}

function getDifferenceData(a: TimeSeriesData, b: TimeSeriesData): TimeSeriesData {
  const diff: TimeSeriesData = []
  for (let i = 0; i < a.length; i++) {
    const va = a[i].v
    const vb = b[i].v

    diff[i] = {
      t: a[i].t,
      v: va - vb
    }
  }
  return diff
}

function makeSlugForSingleScenario(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): string {
  return makeCompositeKey([scenarioSlug, variableSlug, pointSlug])
}

function makeSlugForComparisonScenario(
  scenarioASlug: string,
  scenarioBSlug: string | null,
  variableSlug: string,
  pointSlug: string
): string {
  return makeCompositeKey([scenarioASlug, scenarioBSlug, variableSlug, pointSlug])
}

// key is in the form `${scenarioSlug};${variableSlug};${pointSlug}`
async function fetchSimulationResultTimeSeries(key: string): Promise<TimeSeriesData> {
  const [scenarioASlug, variableSlug, pointSlug] = parseCompositeKey(key)
  return fetchSimulationResultTimeSeriesForScenarioVariableAndPoint(
    scenarioASlug!,
    variableSlug!,
    pointSlug!
  )
}

export const useSimulationResultTimeSeriesStore = defineStore('simulationResultTimeSeries', () => {
  const scenarioDataCache = new KeyedCache<TimeSeriesData, Error>(fetchSimulationResultTimeSeries)

  const simulationResultTimeSeriesCache = new KeyedCache<
    SimulationResultTimeSeriesComparison,
    Error
  >(
    // key is in the form `${scenarioASlug};${scenarioBSlug};${variableSlug};${pointSlug}`
    async (key: string) => {
      const [scenarioASlug, scenarioBSlug, variableSlug, pointSlug] = parseCompositeKey(key)

      const [scenarioAData, scenarioBData] = await Promise.all([
        scenarioDataCache.get(makeSlugForSingleScenario(scenarioASlug!, variableSlug!, pointSlug!)),
        scenarioBSlug
          ? scenarioDataCache.get(
              makeSlugForSingleScenario(scenarioBSlug, variableSlug!, pointSlug!)
            )
          : null
      ])

      const differenceData = scenarioBData ? getDifferenceData(scenarioAData, scenarioBData) : null

      return {
        scenarioA: scenarioAData,
        scenarioB: scenarioBData ?? null,
        difference: differenceData
      }
    }
  )

  async function getSimulationResultTimeSeries(
    scenarioASlug: string,
    scenarioBSlug: string | null,
    variableSlug: string,
    pointSlug: string
  ): Promise<SimulationResultTimeSeriesComparison> {
    return simulationResultTimeSeriesCache.get(
      makeSlugForComparisonScenario(scenarioASlug, scenarioBSlug, variableSlug, pointSlug)
    )
  }

  return {
    getSimulationResultTimeSeries
  }
})
