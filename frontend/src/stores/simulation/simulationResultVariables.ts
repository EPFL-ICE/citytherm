import { cdnUrl } from '@/config/layerTypes'
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
  available_at?: number[] // heights in meters where the variable is available
  group?: string
  category_slug?: string
}

export type SluggedSimulationResultVariable = SimulationResultVariable & { slug: string }

export interface VariableAttributes {
  categories: {
    [key: string]: {
      name: string
      variables: string[]
    }
  }
  variables: { [key: string]: SimulationResultVariable }
}

export type SluggedVariableAttributes = {
  categories: VariableAttributes['categories']
  variables: SluggedSimulationResultVariable[]
}

async function fetchVariablesAttributes(): Promise<VariableAttributes> {
  const response = await fetch(`${cdnUrl}/simulation/variablesAttributes.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch variable attributes: ${response.statusText}`)
  }
  return response.json()
}

export const useSimulationResultVariablesStore = defineStore('simulationResultVariables', () => {
  const simulationResultVariablesCache = new KeyedCache<VariableAttributes, Error>(
    fetchVariablesAttributes
  )

  async function getVariableAttributes(): Promise<VariableAttributes> {
    return simulationResultVariablesCache.get('all') // TODO: make cache without key ?
  }

  async function getSimulationResultVariables(): Promise<VariableAttributes['variables']> {
    return (await simulationResultVariablesCache.get('all')).variables // TODO: make cache without key ?
  }

  async function getVarriableAttributesSlugged(): Promise<SluggedVariableAttributes> {
    const attributes = await getVariableAttributes()

    return {
      categories: attributes.categories,
      variables: Object.entries(attributes.variables).map(([slug, data]) => ({ ...data, slug }))
    }
  }

  async function getSimulationResultVariablesList(): Promise<SluggedSimulationResultVariable[]> {
    const variables = await getSimulationResultVariables()
    return Object.entries(variables).map(([slug, data]) => ({ ...data, slug }))
  }

  return {
    getVariableAttributes,
    getSimulationResultVariables,
    getVarriableAttributesSlugged,
    getSimulationResultVariablesList
  }
})
