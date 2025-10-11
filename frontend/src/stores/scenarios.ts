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
  private cache = new Map<string, CacheItem<T, E>>()
  private fetcher: (key: string) => Promise<T>

  constructor(fetcher: (key: string) => Promise<T>) {
    this.fetcher = fetcher
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!
      if (item.status === 'success') {
        return item.data
      }
      if (item.status === 'loading') {
        return item.promise
      }
    }
    const promise = this.fetcher(key)
    this.cache.set(key, { status: 'loading', promise })
    try {
      const data = await promise
      this.cache.set(key, { status: 'success', data })
      return data
    } catch (error) {
      this.cache.set(key, { status: 'error', error: error as E })
      throw error
    }
  }
}

type BuildingHeight = { x: number; y: number; h: number }

export type Scenario = { buildingHeights: BuildingHeight[] }

async function fetchScenario(key: string): Promise<Scenario> {
  const response = await fetch(`/simulation/scenarios/${key}/building_heights.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch scenario: ${response.statusText}`)
  }
  return { buildingHeights: await response.json() }
}

export const useScenariosStore = defineStore('scenarios', () => {
  const scenariosCache = new KeyedCache<Scenario, Error>(fetchScenario)

  async function getScenario(key: string): Promise<Scenario> {
    return scenariosCache.get(key)
  }

  return {
    getScenario
  }
})
