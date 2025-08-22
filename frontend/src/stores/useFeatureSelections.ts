import { defineStore } from 'pinia'
import centroid from '@turf/centroid'
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { useCityStore } from './city'

export type SelectedItem = {
  id: string | number
  index: number // 1..N
  centroid: [number, number] // [lng, lat]
  props: Record<string, any>
}

export type LabelMode = '1..N' | '0..9'

// City-specific selections storage
type CitySelections = Record<string, SelectedItem[]>

const STORAGE_KEY_DEFAULT = 'ml-selected-cells:v2' // Updated version

export const useFeatureSelections = defineStore('featureSelections', {
  state: () => ({
    // Store selections for each city separately
    citySelections: {} as CitySelections,
    max: 6 as number,
    labelMode: '1..N' as LabelMode,
    storageKey: STORAGE_KEY_DEFAULT as string
  }),
  getters: {
    // Get items for the current city
    items(): SelectedItem[] {
      const cityStore = useCityStore()
      return this.citySelections[cityStore.city] || []
    },
    featureCollection(): any {
      const cityStore = useCityStore()
      const currentItems = this.citySelections[cityStore.city] || []
      const features = currentItems.map((it) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: it.centroid },
        properties: {
          id: it.id,
          label: this.labelMode === '0..9' ? it.index % 10 : it.index
        }
      }))

      const collection = {
        type: 'FeatureCollection',
        features: features
      }

      return collection
    }
  },
  actions: {
    // Initialize selections for a city if not already present
    initializeCitySelections(city: string) {
      if (!this.citySelections[city]) {
        this.citySelections[city] = []
      }
    },

    configure(opts: { max?: number; labelMode?: LabelMode; storageKey?: string } = {}) {
      if (typeof opts.max === 'number') this.max = opts.max
      if (opts.labelMode) this.labelMode = opts.labelMode
      if (opts.storageKey) this.storageKey = opts.storageKey
    },

    toggleFromFeature(
      f: Feature<Polygon | MultiPolygon | Point, any> | MapGeoJSONFeature,
      cellIdProp = 'cell_id'
    ) {
      const cityStore = useCityStore()
      const currentCity = cityStore.city

      // Initialize selections for current city if needed
      this.initializeCitySelections(currentCity)

      const id = (f.properties?.[cellIdProp] ?? f.id) as string | number | undefined
      if (id == null) return

      const currentItems = this.citySelections[currentCity]
      const idx = currentItems.findIndex((x) => x.id === id)

      if (idx >= 0) {
        // Remove item
        currentItems.splice(idx, 1)
        this.reindex(currentCity)
        this.serialize()
        return
      }

      if (currentItems.length >= this.max) return

      const c = this.safeCentroid(f)
      currentItems.push({
        id,
        index: currentItems.length + 1,
        centroid: c,
        props: f.properties ?? {}
      })
      this.serialize()
    },

    remove(id: string | number) {
      const cityStore = useCityStore()
      const currentCity = cityStore.city

      // Initialize selections for current city if needed
      this.initializeCitySelections(currentCity)

      const currentItems = this.citySelections[currentCity]
      const i = currentItems.findIndex((x) => x.id === id)

      if (i >= 0) {
        currentItems.splice(i, 1)
        this.reindex(currentCity)
        this.serialize()
      }
    },

    clear() {
      const cityStore = useCityStore()
      const currentCity = cityStore.city

      // Initialize selections for current city if needed
      this.initializeCitySelections(currentCity)

      this.citySelections[currentCity] = []
      this.serialize()
    },

    reindex(city: string) {
      const currentItems = this.citySelections[city]
      currentItems.forEach((x, i) => (x.index = i + 1))
    },

    safeCentroid(f: Feature<any, any> | MapGeoJSONFeature): [number, number] {
      try {
        const c = centroid(f).geometry.coordinates as [number, number]
        if (Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
          return c
        }
      } catch {
        /* fall through */
      }
      const lon = f.properties?.centroid_lon ?? f.properties?.lon ?? f.properties?.lng
      const lat = f.properties?.centroid_lat ?? f.properties?.lat
      if (Number.isFinite(lon) && Number.isFinite(lat)) return [Number(lon), Number(lat)]
      // last resort
      return [0, 0]
    },

    serialize() {
      try {
        // Serialize all city selections
        const payload = {
          version: 2, // Updated version
          citySelections: this.citySelections
        }
        localStorage.setItem(this.storageKey, JSON.stringify(payload))
      } catch {
        /* ignore */
      }
    },

    hydrate() {
      try {
        const raw = localStorage.getItem(this.storageKey)
        if (!raw) return
        const parsed = JSON.parse(raw)

        if (parsed.version === 2 && parsed.citySelections) {
          // New format with city-specific selections
          this.citySelections = parsed.citySelections
        } else if (parsed.version === 1 && parsed.items && Array.isArray(parsed.items)) {
          // Old format - migrate to new format with default city (Geneva)
          this.citySelections = {
            geneva: parsed.items.map((it: any) => ({
              id: it.id,
              index: it.index,
              centroid: it.centroid,
              props: it.props ?? {}
            }))
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
})
