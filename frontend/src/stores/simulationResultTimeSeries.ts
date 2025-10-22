import { KeyedCache } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type TimeSeriesDataPoint = {
  t: string
  v: number
}

export type TimeSeriesData = TimeSeriesDataPoint[]

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

function makeSlugForSingleScenario(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): string {
  return `${scenarioSlug};${variableSlug};${pointSlug}`
}

// key is in the form `${scenarioSlug};${variableSlug};${pointSlug}`
async function fetchSimulationResultTimeSeries(key: string): Promise<TimeSeriesData> {
  const [scenarioASlug, variableSlug, pointSlug] = key
    .split(';')
    .map((s) => (s === '_' || s === 'null' ? null : s))
  return fetchSimulationResultTimeSeriesForScenarioVariableAndPoint(
    scenarioASlug!,
    variableSlug!,
    pointSlug!
  )
}

export const useSimulationResultTimeSeriesStore = defineStore('simulationResultTimeSeries', () => {
  const scenarioDataCache = new KeyedCache<TimeSeriesData, Error>(fetchSimulationResultTimeSeries)

  async function getSimulationResultTimeSeries(
    scenarioASlug: string,
    variableSlug: string,
    pointSlug: string
  ): Promise<TimeSeriesData> {
    return scenarioDataCache.get(makeSlugForSingleScenario(scenarioASlug, variableSlug, pointSlug))
  }

  return {
    getSimulationResultTimeSeries
  }
})
