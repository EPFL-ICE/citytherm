import { defineStore } from 'pinia'
import centroid from '@turf/centroid'
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson'
import type { MapGeoJSONFeature } from 'maplibre-gl'

export type SelectedItem = {
  id: string | number
  index: number // 1..N
  centroid: [number, number] // [lng, lat]
  props: Record<string, any>
}

export type LabelMode = '1..N' | '0..9'

const STORAGE_KEY_DEFAULT = 'ml-selected-cells:v1'

export const useFeatureSelections = defineStore('featureSelections', {
  state: () => ({
    items: [] as SelectedItem[],
    max: 6 as number,
    labelMode: '1..N' as LabelMode,
    storageKey: STORAGE_KEY_DEFAULT as string
  }),
  getters: {
    featureCollection(state) {
      return {
        type: 'FeatureCollection',
        features: state.items.map((it) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: it.centroid },
          properties: {
            id: it.id,
            label: state.labelMode === '0..9' ? it.index % 10 : it.index
          }
        }))
      } as const
    }
  },
  actions: {
    configure(opts: { max?: number; labelMode?: LabelMode; storageKey?: string } = {}) {
      if (typeof opts.max === 'number') this.max = opts.max
      if (opts.labelMode) this.labelMode = opts.labelMode
      if (opts.storageKey) this.storageKey = opts.storageKey
    },

    toggleFromFeature(
      f: Feature<Polygon | MultiPolygon | Point, any> | MapGeoJSONFeature,
      cellIdProp = 'cell_id'
    ) {
      const id = (f.properties?.[cellIdProp] ?? f.id) as string | number | undefined
      if (id == null) return

      const idx = this.items.findIndex((x) => x.id === id)
      if (idx >= 0) {
        this.items.splice(idx, 1)
        this.reindex()
        this.serialize()
        return
      }
      if (this.items.length >= this.max) return

      const c = this.safeCentroid(f)
      this.items.push({
        id,
        index: this.items.length + 1,
        centroid: c,
        props: f.properties ?? {}
      })
      this.serialize()
    },

    remove(id: string | number) {
      const i = this.items.findIndex((x) => x.id === id)
      if (i >= 0) {
        this.items.splice(i, 1)
        this.reindex()
        this.serialize()
      }
    },

    clear() {
      this.items = []
      this.serialize()
    },

    reindex() {
      this.items.forEach((x, i) => (x.index = i + 1))
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
        const payload = {
          version: 1,
          items: this.items
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
        if (parsed?.items && Array.isArray(parsed.items)) {
          this.items = parsed.items.map((it: any) => ({
            id: it.id,
            index: it.index,
            centroid: it.centroid,
            props: it.props ?? {}
          }))
        }
      } catch {
        /* ignore */
      }
    }
  }
})
