import type { TableRow } from '@/stores/compare'
import type { MapLayerConfig } from '@/config/layerTypes'

export function toCSV(
  rows: TableRow[],
  layerIds: string[],
  layerMap: Record<string, MapLayerConfig>
): void {
  const headers = ['Neighborhood ID', 'Label', ...layerIds.map((id) => layerMap[id]?.label || id)]
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.uid, r.label ?? '', ...layerIds.map((id) => r.values[id] ?? '')]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `comparison_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`
  a.click()
}
