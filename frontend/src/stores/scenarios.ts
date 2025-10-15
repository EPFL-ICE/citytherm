import { defineStore } from 'pinia'

type CacheItem<T, E> =
  | {
    status: 'idle'
  }
  | {
    status: 'loading'
    promise: Promise<T>
  }
  | {
    status: 'error'
    error: E
  }
  | {
    status: 'success'
    data: T
  }

class KeyedCache<T, E> {
  private cache = new Map<string, CacheItem<T, E>>();
  private fetcher: (key: string) => Promise<T>;

  constructor(fetcher: (key: string) => Promise<T>) {
    this.fetcher = fetcher;
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      if (item.status === 'success') {
        return item.data;
      }
      if (item.status === 'loading') {
        return item.promise;
      }
    }
    const promise = this.fetcher(key);
    this.cache.set(key, { status: 'loading', promise });
    try {
      const data = await promise;
      this.cache.set(key, { status: 'success', data });
      return data;
    } catch (error) {
      this.cache.set(key, { status: 'error', error: error as E });
      throw error;
    }
  }
}

export interface BuildingPart {
  x: number;
  y: number;
  h?: number; // Height of the part, defaults to defaultHeight if unspecified
  sc?: string; // side color, defaults to defaultSideColor if unspecified
  tc?: string; // top color, defaults to defaultTopColor if unspecified
}

export interface BuildingMap {
  defaultHeight: number;
  defaultSideColor: string; // hex color
  defaultTopColor: string; // hex color
  buildingsParts: BuildingPart[];
}

export interface SoilTypeAnomaly {
  x: number;
  y: number;
  t: number; // type of the anomaly
}

export interface SoilMap {
  defaultSoilType: number; // of type number to match the code in the NetCDF data (2007 -> Asphalt, 2045 -> High albedo material, etc...)
  anomalies: { [key: `${number};${number}`]: SoilTypeAnomaly };
}

export type Scenario = {
  soil: SoilMap;
  buildings: BuildingMap;
}

async function fetchBuilding(key: string): Promise<BuildingMap> {
  const response = await fetch(`/simulation/scenarios/${key}/buildingMap.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch building map: ${response.statusText}`);
  }
  return response.json();
}

async function fetchSoilMap(key: string): Promise<SoilMap> {
  const response = await fetch(`/simulation/scenarios/${key}/soilMap.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch soil map: ${response.statusText}`);
  }
  return response.json();
}

async function fetchScenario(key: string): Promise<Scenario> {
  const [buildings, soil] = await Promise.all([
    fetchBuilding(key),
    fetchSoilMap(key)
  ]);
  return { buildings, soil };
}

export interface ScenarioDescription {
  id: string;
  slug: string;
  scenario: string;
  description: string;
  key_variables_changed: string;
  primary_analysis_focus: string;
  representative_LCZ: string;
  details?: string;
  relevant_lectures: string[];
}

async function fetchScenarioDescriptions(): Promise<ScenarioDescription[]> {
  const response = await fetch('/simulation/scenarios/scenarios.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch scenario descriptions: ${response.statusText}`);
  }
  return response.json();
}

export const useScenariosStore = defineStore('scenarios', () => {
  const scenarioDescriptionsCache = new KeyedCache<ScenarioDescription[], Error>(fetchScenarioDescriptions);
  const scenariosCache = new KeyedCache<Scenario, Error>(fetchScenario);

  async function getScenarioDescriptions(): Promise<ScenarioDescription[]> {
    return scenarioDescriptionsCache.get('all'); // TODO: make cache without key ?
  }

  async function getScenario(key: string): Promise<Scenario> {
    return scenariosCache.get(key);
  }

  return {
    getScenarioDescriptions,
    getScenario
  }
});
