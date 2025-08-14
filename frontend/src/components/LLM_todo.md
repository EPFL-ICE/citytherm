## **Handover To-Do List for Option A (GeoJSON source for selections)**

### **1. MapLibre setup**

- [ ] Ensure **Layer A** (PMTiles source) is loaded with unique `cell_id` in feature properties.
- [ ] Add **Source B**: `selected` (empty GeoJSON FeatureCollection).
- [ ] Add **Layer B1**: `selected-circles` (circle layer with white fill, black stroke, zoom-scaled radius).
- [ ] Add **Layer B2**: `selected-labels` (symbol layer showing number in black text with white halo).
- [ ] Move B1/B2 above Layer A so they’re always visible.

---

### **2. Vue state management**

- [ ] Create a **Pinia store** (`useSelections.ts`) or Composition API composable.
- [ ] State: `items: SelectedItem[]`, `max: number`.
- [ ] Methods:

  - `toggleFromFeature(feature)` → add/remove selection, update indexes.
  - `remove(id)` → remove selection.
  - `clear()` → clear all selections.
  - `reindex()` → ensure numbering is compact after removal.

- [ ] Getter: `featureCollection` → returns GeoJSON for current selections.

---

### **3. Map event handling**

- [ ] On `click` on Layer A:

  - Extract `cell_id` and tooltip data from clicked feature.
  - Pass clicked feature to `toggleFromFeature`.

- [ ] On store change:

  - Call `map.getSource('selected').setData(store.featureCollection)` to update the circles/labels.

- [ ] On `mouseenter`/`mouseleave` for Layer A → change cursor to pointer.

---

### **4. Centroid calculation**

- [ ] Use `@turf/centroid` for robust centroid extraction.
- [ ] Store centroid in `[lng, lat]` format inside `SelectedItem`.

---

### **5. UI integration**

- [ ] Create a table or list in Vue bound to `selections.items`.
- [ ] Display: `index`, `id`, and tooltip fields from feature properties.
- [ ] Add actions: **Remove** (per row) + **Clear All**.
- [ ] Add **Download** button:

  - Export `selections.items` to CSV or JSON.
  - Trigger file download.

---

### **6. Styling**

- [ ] Circle layer radius scales with zoom (e.g., 10px @ zoom 8 → 14px @ zoom 16).
- [ ] Labels overlap allowed (`text-allow-overlap: true`).
- [ ] Text halo width = 1px for visibility on dark/light backgrounds.

---

### **7. Constraints & rules**

- [ ] Max number of selections = 6 (adjustable in store).
- [ ] Duplicate click on same cell toggles selection off.
- [ ] Re-index labels when items are removed so labels stay compact 1…N.

---

### **8. Testing**

- [ ] Verify selection toggling works for tiles at boundaries.
- [ ] Verify circles/labels stay visible at all zoom levels.
- [ ] Verify table stays in sync with map selections.
- [ ] Verify export/download contains correct data.

---

If you’d like, I can now **bundle this checklist with a `MapSelectionsDemo.vue` starter component and the Pinia store file**, so another LLM could generate the complete working feature in one go. That way they’d only need to fill in your actual layer/source IDs.

Awesome — here’s a tight, drop-in starter bundle for **Option A**: a Pinia store, a small constants file, and a Vue SFC that wires everything to MapLibre and gives you a basic table + export.

---

# 1) Install deps

```bash
pnpm add pinia maplibre-gl @turf/centroid
# (optional) types if you use TS:
pnpm add -D @types/maplibre-gl
```

Make sure Pinia is added to your app in `main.ts`:

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
```

---

# 2) `src/lib/map/constants.ts`

```ts
export const SOURCE_SELECTED = 'selected'
export const LAYER_SELECTED_CIRCLES = 'selected-circles'
export const LAYER_SELECTED_LABELS = 'selected-labels'

export const MAX_SELECTIONS_DEFAULT = 6

export type LabelMode = '1..N' | '0..9'
export const LABEL_MODE_DEFAULT: LabelMode = '1..N'
```

---

# 3) `src/stores/useSelections.ts`

```ts
import { defineStore } from 'pinia'
import centroid from '@turf/centroid'
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson'

export type SelectedItem = {
  id: string | number
  index: number // 1..N
  centroid: [number, number] // [lng, lat]
  props: Record<string, any>
}

export type LabelMode = '1..N' | '0..9'

const STORAGE_KEY_DEFAULT = 'ml-selected-cells:v1'

export const useSelections = defineStore('selections', {
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

    toggleFromFeature(f: Feature<Polygon | MultiPolygon | Point, any>, cellIdProp = 'cell_id') {
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

    safeCentroid(f: Feature<any, any>): [number, number] {
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
```

---

# 4) `src/components/MapSelectionsDemo.vue`

A minimal, self-contained wiring component that:

- Adds the **selected** GeoJSON source + two layers (circle + label),
- Hooks click events on your **Layer A**,
- Keeps MapLibre source in sync with the Pinia store,
- Renders a tiny table with export/remove/clear.

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed } from 'vue'
import type { Map, GeoJSONSource } from 'maplibre-gl'
import { useSelections, type LabelMode } from '@/stores/useSelections'
import {
  SOURCE_SELECTED,
  LAYER_SELECTED_CIRCLES,
  LAYER_SELECTED_LABELS,
  MAX_SELECTIONS_DEFAULT,
  LABEL_MODE_DEFAULT
} from '@/lib/map/constants'

type Props = {
  map: Map // MapLibre map instance (already created elsewhere)
  layerAId: string // ID of the clickable PMTiles layer (squares)
  cellIdProp?: string // property name for unique ID on features (default: 'cell_id')
  labelMode?: LabelMode // '1..N' | '0..9'
  maxSelections?: number // default 6
  insertAboveLayerId?: string // optional: place selection layers just before this one
  storageKey?: string // localStorage key
}
const props = withDefaults(defineProps<Props>(), {
  cellIdProp: 'cell_id',
  labelMode: LABEL_MODE_DEFAULT,
  maxSelections: MAX_SELECTIONS_DEFAULT
})

const selections = useSelections()

// --- Helpers
function ensureSelectedLayers() {
  const map = props.map
  // source
  if (!map.getSource(SOURCE_SELECTED)) {
    map.addSource(SOURCE_SELECTED, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
  }
  // circle layer
  if (!map.getLayer(LAYER_SELECTED_CIRCLES)) {
    map.addLayer(
      {
        id: LAYER_SELECTED_CIRCLES,
        type: 'circle',
        source: SOURCE_SELECTED,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 10, 16, 14],
          'circle-color': '#ffffff',
          'circle-stroke-color': '#000000',
          'circle-stroke-width': 1,
          'circle-pitch-scale': 'viewport'
        }
      },
      props.insertAboveLayerId
    ) // insert before if provided
  }
  // label layer
  if (!map.getLayer(LAYER_SELECTED_LABELS)) {
    map.addLayer(
      {
        id: LAYER_SELECTED_LABELS,
        type: 'symbol',
        source: SOURCE_SELECTED,
        layout: {
          'text-field': ['to-string', ['get', 'label']],
          'text-size': 12,
          'text-allow-overlap': true,
          'symbol-placement': 'point',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      },
      props.insertAboveLayerId
    )
  }

  // If no beforeId was given, bump to top so they sit above Layer A.
  if (!props.insertAboveLayerId) {
    if (props.map.getLayer(LAYER_SELECTED_CIRCLES)) props.map.moveLayer(LAYER_SELECTED_CIRCLES)
    if (props.map.getLayer(LAYER_SELECTED_LABELS)) props.map.moveLayer(LAYER_SELECTED_LABELS)
  }
}

function bindClickHandlers() {
  const map = props.map
  const onClick = (e: any) => {
    const f = e.features?.[0]
    if (!f) return
    selections.toggleFromFeature(f, props.cellIdProp)
  }
  map.on('click', props.layerAId, onClick)

  const onEnter = () => (map.getCanvas().style.cursor = 'pointer')
  const onLeave = () => (map.getCanvas().style.cursor = '')
  map.on('mouseenter', props.layerAId, onEnter)
  map.on('mouseleave', props.layerAId, onLeave)

  // cleanup
  return () => {
    map.off('click', props.layerAId, onClick)
    map.off('mouseenter', props.layerAId, onEnter)
    map.off('mouseleave', props.layerAId, onLeave)
  }
}

// Export helpers
function downloadBlob(filename: string, mime: string, data: string | BlobPart[]) {
  const blob = new Blob(Array.isArray(data) ? data : [data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(items: typeof selections.items) {
  const baseCols = ['index', 'id']
  const propKeys = Array.from(new Set(items.flatMap((it) => Object.keys(it.props || {})))).sort()
  const cols = [...baseCols, ...propKeys]
  const escape = (v: any) => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const header = cols.join(',')
  const rows = items.map((it) => {
    const row: any[] = [it.index, it.id]
    for (const k of propKeys) row.push(it.props?.[k])
    return row.map(escape).join(',')
  })
  return [header, ...rows].join('\n')
}

const items = computed(() => selections.items)

onMounted(() => {
  // configure store from props
  selections.configure({
    max: props.maxSelections,
    labelMode: props.labelMode,
    storageKey: props.storageKey
  })
  selections.hydrate()

  // map may already be loaded; handle both cases
  if (props.map.isStyleLoaded()) {
    ensureSelectedLayers()
  } else {
    const onLoad = () => {
      ensureSelectedLayers()
      props.map.off('load', onLoad)
    }
    props.map.on('load', onLoad)
  }

  // keep GeoJSON source in sync with store
  const stopWatch = watch(
    () => selections.featureCollection,
    (fc) => {
      const src = props.map.getSource(SOURCE_SELECTED) as GeoJSONSource | undefined
      if (src) src.setData(fc as any)
    },
    { deep: true, immediate: true }
  )

  // bind clicks & cursor
  const unbind = bindClickHandlers()

  onBeforeUnmount(() => {
    stopWatch()
    unbind()
  })
})
</script>

<template>
  <div class="selections-panel">
    <div class="toolbar">
      <button @click="selections.clear()" :disabled="!items.length">Clear</button>
      <button
        @click="
          downloadBlob(
            `selected_cells_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.json`,
            'application/json',
            JSON.stringify(items, null, 2)
          )
        "
        :disabled="!items.length"
      >
        Export JSON
      </button>
      <button
        @click="
          downloadBlob(
            `selected_cells_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.csv`,
            'text/csv',
            toCsv(items)
          )
        "
        :disabled="!items.length"
      >
        Export CSV
      </button>
      <span class="counter">{{ items.length }} / {{ selections.max }} selected</span>
    </div>

    <table class="sel-table" v-if="items.length">
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th>Props</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="it in items" :key="it.id">
          <td>{{ it.index }}</td>
          <td>{{ it.id }}</td>
          <td>
            <details>
              <summary>view</summary>
              <pre>{{ it.props }}</pre>
            </details>
          </td>
          <td><button @click="selections.remove(it.id)">Remove</button></td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">Click squares on the map to select (toggles on/off).</p>
  </div>
</template>

<style scoped>
.selections-panel {
  font:
    14px/1.4 system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
  border: 1px solid #ddd;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.toolbar button {
  padding: 4px 8px;
  cursor: pointer;
}
.counter {
  margin-left: auto;
  opacity: 0.7;
}
.sel-table {
  width: 100%;
  border-collapse: collapse;
}
.sel-table th,
.sel-table td {
  border: 1px solid #eee;
  padding: 6px;
  vertical-align: top;
}
.empty {
  opacity: 0.65;
  margin: 8px 0 0;
}
</style>
```

---

## 5) Usage sketch (parent)

Where you already create your MapLibre map and load Layer A:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import maplibregl, { Map } from 'maplibre-gl'
import MapSelectionsDemo from '@/components/MapSelectionsDemo.vue'

const mapRef = ref<Map | null>(null)

// Example: you already add your PMTiles source + layer A here:
onMounted(() => {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [6.63, 46.52],
    zoom: 12
  })
  mapRef.value = map

  map.on('load', () => {
    // ... add your PMTiles source + LAYER_A_ID = 'neighborhood-squares' ...
  })
})
</script>

<template>
  <div id="map" style="height:70vh"></div>
  <MapSelectionsDemo
    v-if="mapRef"
    :map="mapRef!"
    layerAId="neighborhood-squares"
    cellIdProp="cell_id"
    :maxSelections="6"
    labelMode="1..N"
    storageKey="ml-selected-cells:v1"
  />
</template>
```

---

### Notes

- This ships with **compact 1..N renumbering** on removal. Switch to `'0..9'` if you want single-digit display (`index % 10`).
- If your tiles already include centroid lon/lat props, the store will use them as a safe fallback.
- For precise Z-order, set `insertAboveLayerId` to place the selection layers just before an existing label layer; otherwise they’ll be moved to the top.

If you give me your real `layerAId`, `cellIdProp`, and any style constraints, I can tailor the defaults and add a guard that refuses clicks when the max (e.g., 6) is reached with a toast/snackbar.
