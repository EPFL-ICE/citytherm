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
  0.2, 0.6, 1.0, 1.4, 1.8, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39,
  41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75
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
