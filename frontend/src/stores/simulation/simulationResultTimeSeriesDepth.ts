import { cdnUrl } from '@/config/layerTypes'
import { KeyedCache, makeCompositeKey, parseCompositeKey } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

export type TimeSeriesDepthDataPoint = {
  t: string // time
  v: number[] // values at different depths
}

export type TimeSeriesDepthData = {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }
  depths_m: number[]
  data: TimeSeriesDepthDataPoint[]
}
/*
export type SimulationResultTimeSeriesMultiData = {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }
  scenarios: Record<string, TimeSeriesDataPoint[]> // key is slug
}

export type SimulationResultTimeSeriesMultiVariableData = {
  requested_coords?: { x: number; y: number; z: number }
  true_coords?: { x: number; y: number; z: number }
  variables: Record<string, TimeSeriesDataPoint[]> // key is slug
}*/

async function fetchSimulationResultTimeSeriesDepthForScenarioVariableAndPoint(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): Promise<TimeSeriesDepthData> {
  const response = await fetch(
    `${cdnUrl}/simulation/scenarios/${scenarioSlug}/${variableSlug}/depthTimeSeries/${pointSlug}.json`,
    { cache: 'no-store' }
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch simulation result: ${response.statusText}`)
  }
  return response.json()
}

function makeSlugForTimeSeriesDepthPoint(
  scenarioSlug: string,
  variableSlug: string,
  pointSlug: string
): string {
  return makeCompositeKey([scenarioSlug, variableSlug, pointSlug])
}

// key is in the form `${scenarioSlug};${variableSlug};${pointSlug}`
async function fetchSimulationResultTimeSeriesDepth(key: string): Promise<TimeSeriesDepthData> {
  const [scenarioSlug, variableSlug, pointSlug] = parseCompositeKey(key)
  return fetchSimulationResultTimeSeriesDepthForScenarioVariableAndPoint(
    scenarioSlug!,
    variableSlug!,
    pointSlug!
  )
}

export const useSimulationResultTimeSeriesDepthStore = defineStore(
  'simulationResultTimeSeriesDepth',
  () => {
    const simulationResultTimeSeriesDepthCache = new KeyedCache<TimeSeriesDepthData, Error>(
      fetchSimulationResultTimeSeriesDepth
    )

    async function getSimulationResultTimeSeriesDepth(
      scenarioSlug: string,
      variableSlug: string,
      pointSlug: string
    ): Promise<TimeSeriesDepthData> {
      return simulationResultTimeSeriesDepthCache.get(
        makeSlugForTimeSeriesDepthPoint(scenarioSlug, variableSlug, pointSlug)
      )
    }

    return {
      getSimulationResultTimeSeriesDepth
    }
  }
)
