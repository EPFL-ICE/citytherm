import type { HeatmapData } from '@/components/charts/MatrixHeatmap.vue'
import { getFinalPositionFromIndexAndAxes, getGraphAxesForPlane } from '@/lib/simulation/graphAxis'
import type { TimeSeriesPoint } from '@/stores/simulation/scenarios'
import type { SimulationResultPlaneAtomicData } from '@/stores/simulation/simulationResultPlane'
import {
  makePointSlugArray,
  type TimeSeriesDataPoint
} from '@/stores/simulation/simulationResultTimeSeries'

export type DisplayMode = 'scenarioA' | 'scenarioB' | 'difference'

export function getMetadataForDataIndex(
  indexX: number,
  indexY: number,
  planeSlug: string,
  timeSeriesPointsList?: TimeSeriesPoint[] | null
): { pointSlug: string } | undefined {
  if (!timeSeriesPointsList) return undefined

  const { x: trueX, y: trueY } = getFinalPositionFromIndexAndAxes(
    indexX,
    indexY,
    getGraphAxesForPlane(planeSlug),
    false
  )
  const point = timeSeriesPointsList.find((point) => point.c[0] === trueX && point.c[1] === trueY)
  if (point) {
    return { pointSlug: makePointSlugArray(point.c) }
  }

  return undefined
}

export function dataToHeatmapData(
  data: (number | null)[][],
  flipX: boolean,
  planeSlug: string,
  timeSeriesPointsList?: TimeSeriesPoint[] | null
): HeatmapData[] {
  const heatmapData: HeatmapData[] = []
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const x = flipX ? data.length - 1 - i : i
      heatmapData.push({
        value: [x, j, data[i][j]],
        metadata: getMetadataForDataIndex(i, j, planeSlug, timeSeriesPointsList)
      })
    }
  }
  return heatmapData
}

export function getMinMax(data: SimulationResultPlaneAtomicData | undefined | null): {
  min: number
  max: number
} {
  if (!data) return { min: 0, max: 100 }

  let min = Infinity
  let max = -Infinity

  for (const row of data) {
    for (const value of row) {
      if (value === null) continue
      if (value < min) min = value
      if (value > max) max = value
    }
  }

  return { min, max }
}
