import { cdnUrl } from '@/config/layerTypes'
import { KeyedCache, makeCompositeKey, parseCompositeKey } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type TimeSeriesDataPoint = {
  t: string
  v: number
}

export type TimeSeriesData = {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }
  data: TimeSeriesDataPoint[]
}

export interface SimulationResultTimeSeriesComparison {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }

  scenarioA: TimeSeriesDataPoint[]
  scenarioB?: TimeSeriesDataPoint[] | null
  difference?: TimeSeriesDataPoint[] | null
}

export type SimulationResultTimeSeriesMultiData = {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }
  scenarios: Record<string, TimeSeriesDataPoint[]> // key is slug
}

async function fetchSimulationResultTimeSeriesForScenarioVariableAndPoint(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): Promise<TimeSeriesData> {
  const response = await fetch(
    `${cdnUrl}/simulation/scenarios/${scenarioSlug}/${variableSlug}/timeSeries/${pointSlug}.json`
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

function getDifferenceData(
  a: TimeSeriesDataPoint[],
  b: TimeSeriesDataPoint[]
): TimeSeriesDataPoint[] {
  const diff: TimeSeriesDataPoint[] = []
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

function makeSlugForMultiScenario(
  scenarios: string[],
  variableSlug: string,
  pointSlug: string
): string {
  return makeCompositeKey([scenarios.join('-'), variableSlug, pointSlug])
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

      const differenceData = scenarioBData
        ? getDifferenceData(scenarioAData.data, scenarioBData.data)
        : null

      return {
        requested_coords: scenarioAData.requested_coords,
        true_coords: scenarioAData.true_coords,
        scenarioA: scenarioAData.data,
        scenarioB: scenarioBData?.data ?? null,
        difference: differenceData
      }
    }
  )

  const simulationResultTimeSeriesMultiCache = new KeyedCache<
    SimulationResultTimeSeriesMultiData,
    Error
  >(
    // key is in the form `${scenarios};${variableSlug};${pointSlug}`
    async (key: string) => {
      const [scenariosSlugs, variableSlug, pointSlug] = parseCompositeKey(key)

      const scenariosData: [string, TimeSeriesData][] = await Promise.all(
        scenariosSlugs!.split('-').map(async (slug) => {
          return [
            slug,
            await scenarioDataCache.get(makeSlugForSingleScenario(slug, variableSlug!, pointSlug!))
          ]
        })
      )

      const scenarioAData = scenariosData[0]

      return {
        requested_coords: scenarioAData[1].requested_coords,
        true_coords: scenarioAData[1].true_coords,
        scenarios: Object.fromEntries(scenariosData.map(([key, value]) => [key, value.data]))
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

  async function getSimulationResultMultiTimeSeries(
    scenarios: string[],
    variableSlug: string,
    pointSlug: string
  ): Promise<SimulationResultTimeSeriesMultiData> {
    return simulationResultTimeSeriesMultiCache.get(
      makeSlugForMultiScenario(scenarios, variableSlug, pointSlug)
    )
  }

  return {
    getSimulationResultTimeSeries,
    getSimulationResultMultiTimeSeries
  }
})
