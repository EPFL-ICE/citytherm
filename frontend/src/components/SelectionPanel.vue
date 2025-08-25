<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useFeatureSelections } from '@/stores/useFeatureSelections'

const featureSelections = useFeatureSelections()

onMounted(() => {
  featureSelections.hydrate()
})

function toggleLabelMode() {
  featureSelections.configure({
    labelMode: featureSelections.labelMode === '1..N' ? '0..9' : '1..N'
  })
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

function toCsv(items: typeof featureSelections.items) {
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

const items = computed(() => featureSelections.items)
</script>

<template>
  <div class="selections-panel">
    <div class="toolbar">
      <button @click="featureSelections.clear()" :disabled="!items.length">Clear</button>
      <button @click="toggleLabelMode">Label Mode: {{ featureSelections.labelMode }}</button>
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
      <span class="counter">{{ items.length }} / {{ featureSelections.max }} selected</span>
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
          <td><button @click="featureSelections.remove(it.id)">Remove</button></td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">Click squares on the map to select (toggles on/off).</p>
  </div>
</template>

<style scoped>
.selections-panel {
  font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
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
