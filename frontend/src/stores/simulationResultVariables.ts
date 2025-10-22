import { KeyedCache } from '@/lib/utils/cache'
import { defineStore } from 'pinia'

type GridMapping = 'crs'
type Unit = '°C' | '%' | 'm/s'

export interface SimulationResultVariable {
  valid_min: number
  valid_max: number
  long_name: string
  units: Unit
  emVarDataType: number
  emVarIdx: number
  grid_mapping: GridMapping
}

export type SluggedSimulationResultVariable = SimulationResultVariable & { slug: string }

async function fetchVariablesAttributes(): Promise<{ [key: string]: SimulationResultVariable }> {
  const response = await fetch(`/simulation/variablesAttributes.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch variable attributes: ${response.statusText}`)
  }
  return response.json()
}

export const useSimulationResultVariablesStore = defineStore('simulationResultVariables', () => {
  const simulationResultVariablesCache = new KeyedCache<
    { [key: string]: SimulationResultVariable },
    Error
  >(fetchVariablesAttributes)

  async function getSimulationResultVariables(): Promise<{
    [key: string]: SimulationResultVariable
  }> {
    return simulationResultVariablesCache.get('all') // TODO: make cache without key ?
  }

  async function getSimulationResultVariablesList(): Promise<SluggedSimulationResultVariable[]> {
    const variables = await getSimulationResultVariables()
    return Object.entries(variables).map(([slug, data]) => ({ ...data, slug }))
  }

  return {
    getSimulationResultVariables,
    getSimulationResultVariablesList
  }
})
