import type { SimulationResultVariable } from '@/stores/simulation/simulationResultVariables'

export interface GraphAxis {
  unit: string
  name: string
  cellSize: number
  min: number
  max: number
  valuesOverride?: number[]
}

export interface GraphAxes {
  x: GraphAxis
  y: GraphAxis
}

export function getFinalPositionFromIndexAndAxes(
  indexX: number,
  indexY: number,
  axes: GraphAxes
): { x: number; y: number } {
  const x = axes.x.valuesOverride
    ? axes.x.valuesOverride[indexX]
    : axes.x.min + indexX * axes.x.cellSize + axes.x.cellSize / 2
  const y = axes.y.valuesOverride
    ? axes.y.valuesOverride[indexY]
    : axes.y.min + indexY * axes.y.cellSize + axes.y.cellSize / 2
  return { x, y }
}

const verticalPlaneYAxisOverride = [
  0, 0.4, 0.8, 1.2, 1.6, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
  42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76
]

export function getGraphAxesForPlane(planeSlug: string): GraphAxes {
  if (planeSlug.startsWith('vertical')) {
    return {
      x: {
        name: 'Y',
        unit: 'm',
        cellSize: 2,
        min: 0,
        max: 100
      },
      y: {
        name: 'Z',
        unit: 'm',
        cellSize: 2,
        min: 0,
        max: 41,
        valuesOverride: verticalPlaneYAxisOverride
      }
    }
  }

  return {
    x: {
      name: 'X',
      unit: 'm',
      cellSize: 2,
      min: 0,
      max: 100
    },
    y: {
      name: 'Y',
      unit: 'm',
      cellSize: 2,
      min: 0,
      max: 100
    }
  }
}

export interface ExpectedValueRange {
  min: number
  max: number
}

export function getExpectedValueRangeForVariable(
  variable: SimulationResultVariable,
  difference: boolean
): ExpectedValueRange {
  if (difference) {
    return {
      min: variable.valid_min - variable.valid_max,
      max: variable.valid_max - variable.valid_min
    }
  }

  return {
    min: variable.valid_min,
    max: variable.valid_max
  }
}
