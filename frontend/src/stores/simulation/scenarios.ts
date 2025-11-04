import { cdnUrl } from '@/config/layerTypes'
import { KeyedCache } from '@/lib/utils/cache'
import { defineStore } from 'pinia'
import { makePointSlugArray } from './simulationResultTimeSeries'
import type { get } from 'lodash'

export interface BuildingPart {
  x: number
  y: number
  h?: number // Height of the part, defaults to defaultHeight if unspecified
  sc?: string // side color, defaults to defaultSideColor if unspecified
  tc?: string // top color, defaults to defaultTopColor if unspecified
}

export interface BuildingMap {
  defaultHeight: number
  defaultSideColor: string // hex color
  defaultTopColor: string // hex color
  buildingsParts: BuildingPart[]
}

export interface SoilTypeAnomaly {
  x: number
  y: number
  t: number // type of the anomaly
}

export interface SoilMap {
  defaultSoilType: number // of type number to match the code in the NetCDF data (2007 -> Asphalt, 2045 -> High albedo material, etc...)
  anomalies: { [key: `${number};${number}`]: SoilTypeAnomaly }
}

export interface SimulationObject {
  x: number
  y: number
  o?: number // object type code
}

export interface SimulationObjectMap {
  defaultObject: number
  objects: SimulationObject[]
}

export type ScenarioMap = {
  soil: SoilMap
  buildings: BuildingMap
  objects: SimulationObjectMap
}

async function fetchBuilding(key: string): Promise<BuildingMap> {
  const response = await fetch(`${cdnUrl}/simulation/scenarios/${key}/buildingMap.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch building map: ${response.statusText}`)
  }
  return response.json()
}

async function fetchSoilMap(key: string): Promise<SoilMap> {
  const response = await fetch(`${cdnUrl}/simulation/scenarios/${key}/soilMap.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch soil map: ${response.statusText}`)
  }
  return response.json()
}

async function fetchObjectsMap(key: string): Promise<SimulationObjectMap> {
  const response = await fetch(`${cdnUrl}/simulation/scenarios/${key}/objectsMap.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch objects map: ${response.statusText}`)
  }
  return response.json()
}

async function fetchScenario(key: string): Promise<ScenarioMap> {
  const [buildings, soil, objects] = await Promise.all([
    fetchBuilding(key),
    fetchSoilMap(key),
    fetchObjectsMap(key)
  ])
  return { buildings, soil, objects }
}

// Represents a group, e.g., "Group 1: Building Materials & Urban Form"
export interface Group {
  groupName: string
  scenarios: string[] // Array of scenario slugs (e.g., ["S1_1", "S1_2"])
}

// Represents a single scenario in detail
export interface ScenarioDescription {
  id: string // e.g., "S1.1"
  slug: string // e.g., "S1_1"
  name: string // Scenario name (was "Scenario Category" in the table)
  description: string
  group: string // Group slug this scenario belongs to (e.g., "Group1")
  primaryAnalysisFocus: string
  relevantLectures: string[] // e.g., ["L5", "L8"]
}

// The root object representing the entire dataset
export interface ScenarioCollection {
  groups: { [groupSlug: string]: Group }
  scenarios: { [scenarioSlug: string]: ScenarioDescription }
}

async function fetchScenarioDescriptions(): Promise<ScenarioCollection> {
  const response = await fetch(`${cdnUrl}/simulation/scenarios/scenarios.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch scenario descriptions: ${response.statusText}`)
  }
  return response.json()
}

export interface TimeSeriesPoint {
  c: [number, number, number] // coordinates
  v: string[] // available variables
  p: string // corresponding plane
}

async function fetchScenarioTimeSeriesPoints(scenario: string): Promise<TimeSeriesPoint[]> {
  const response = await fetch(`${cdnUrl}/simulation/scenarios/${scenario}/timeSeriesPoints.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch scenario descriptions: ${response.statusText}`)
  }
  return response.json()
}

export const useScenariosStore = defineStore('scenarios', () => {
  const scenarioDescriptionsCache = new KeyedCache<ScenarioCollection, Error>(
    fetchScenarioDescriptions
  )
  const scenariosCache = new KeyedCache<ScenarioMap, Error>(fetchScenario)
  const scenarioTimeSeriesCache = new KeyedCache<TimeSeriesPoint[], Error>(
    fetchScenarioTimeSeriesPoints
  )

  async function getScenarioDescriptions(): Promise<ScenarioCollection> {
    return scenarioDescriptionsCache.get('all') // TODO: make cache without key ?
  }

  async function getScenarioMap(key: string): Promise<ScenarioMap> {
    return scenariosCache.get(key)
  }

  async function getScenarioDescriptionBySlug(slug: string) {
    const scenarios = await getScenarioDescriptions()
    const scenario = scenarios.scenarios[slug]
    if (!scenario) {
      throw new Error(`Scenario with slug ${slug} not found`)
    }
    return scenario
  }

  async function getAvailableTimeSeriesPointsForScenario(slug: string): Promise<TimeSeriesPoint[]> {
    return scenarioTimeSeriesCache.get(slug)
  }

  async function getFullTimeSeriesPointFromSlug(
    scenarioSlug: string,
    pointSlug: string
  ): Promise<TimeSeriesPoint | null> {
    const points = await scenarioTimeSeriesCache.get(scenarioSlug)
    return points.find((p) => makePointSlugArray(p.c) === pointSlug) ?? null
  }

  function getFullTimeSeriesPointFromSlugOrNull(
    scenarioSlug: string,
    pointSlug: string
  ): TimeSeriesPoint | null {
    const points = scenarioTimeSeriesCache.getOrNull(scenarioSlug)
    if (!points) return null
    return points.find((p) => makePointSlugArray(p.c) === pointSlug) ?? null
  }

  return {
    getScenarioDescriptions,
    getScenarioMap,
    getScenarioDescriptionBySlug,
    getAvailableTimeSeriesPointsForScenario,
    getFullTimeSeriesPointFromSlug,
    getFullTimeSeriesPointFromSlugOrNull
  }
})
