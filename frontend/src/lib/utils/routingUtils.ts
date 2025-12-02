import {
  variableForPlaneOrFallback,
  type SimulationPlanePreset
} from '../simulation/simulationResultPlanesUtils'

export interface ScenarioPickerParams {
  scenario: string | null
  plane: string | null
}

export function makePathToScenarioPicker(params: ScenarioPickerParams) {
  const scenarioStr = params.scenario ? `scenarios=${params.scenario}` : ''
  const planeStr = params.plane ? `&plane=${params.plane}` : ''
  return `/simulation?${scenarioStr}${planeStr}`
}

export function makePathToScenarioPickerMerge(
  newParams: Partial<ScenarioPickerParams>,
  oldParams: ScenarioPickerParams
) {
  return makePathToScenarioPicker({
    ...oldParams,
    ...newParams
  })
}

export interface PlaneExplorerPageParams {
  plane: string
  time: string
  variable: string
  scenarios: string[]
}

export function makePathToPlaneExplorer(params: PlaneExplorerPageParams) {
  const scenarios = [...params.scenarios]
  if (!scenarios.includes('S0')) {
    scenarios.unshift('S0')
  }
  const v = variableForPlaneOrFallback(params.plane as SimulationPlanePreset, params.variable)
  return `/simulation/plane/explorer/${params.plane}/${params.time}/${v}?scenarios=${encodeURIComponent(
    scenarios.join(',')
  )}`
}

export function makePathToPlaneExplorerMerge(
  newParams: Partial<PlaneExplorerPageParams>,
  oldParams: PlaneExplorerPageParams
) {
  return makePathToPlaneExplorer({
    ...oldParams,
    ...newParams
  })
}

export interface PlaneSingleExplorerPageParams {
  plane: string
  time: string
  scenario: string
  variables: string[]
}

export function makePathToPlaneSingleExplorer(params: PlaneSingleExplorerPageParams) {
  const vars = new Set(
    params.variables.map((v) =>
      variableForPlaneOrFallback(params.plane as SimulationPlanePreset, v)
    )
  )
  return `/simulation/plane/single/${params.plane}/${params.time}/${params.scenario}?vars=${encodeURIComponent(
    Array.from(vars).join(',')
  )}`
}

export function makePathToPlaneSingleExplorerMerge(
  newParams: Partial<PlaneSingleExplorerPageParams>,
  oldParams: PlaneSingleExplorerPageParams
) {
  return makePathToPlaneSingleExplorer({
    ...oldParams,
    ...newParams
  })
}

export interface PlaneComparatorPageParams {
  scenarioA: string
  scenarioB: string | null
  plane: string
  time: string
  variables: string[]
}

export function makePathToPlaneComparator(params: PlaneComparatorPageParams) {
  const vars = new Set(
    params.variables.map((v) =>
      variableForPlaneOrFallback(params.plane as SimulationPlanePreset, v)
    )
  )
  return `/simulation/plane/comparator/${params.scenarioA}/${params.scenarioB ?? '_'}/${params.plane}/${
    params.time
  }?vars=${encodeURIComponent(Array.from(vars).join(','))}`
}

export function makePathToPlaneComparatorMerge(
  newParams: Partial<PlaneComparatorPageParams>,
  oldParams: PlaneComparatorPageParams
) {
  return makePathToPlaneComparator({
    ...oldParams,
    ...newParams
  })
}

export interface TimeSeriesExplorerParams {
  scenarios: string[]
  variables: string[]
  point: string
}

export function makePathToTimeSeriesExplorer(params: TimeSeriesExplorerParams) {
  const vars = new Set(params.variables.map((v) => variableForPointOrFallback(params.point, v)))
  const scenarios = [...params.scenarios]
  if (!scenarios.includes('S0')) {
    scenarios.unshift('S0')
  }
  return `/simulation/timeSeries/explorer/${
    params.point
  }?vars=${encodeURIComponent(Array.from(vars).join(','))}&scenarios=${encodeURIComponent(scenarios.join(','))}`
}

export function makePathToTimeSeriesExplorerMerge(
  newParams: Partial<TimeSeriesExplorerParams>,
  oldParams: TimeSeriesExplorerParams
) {
  return makePathToTimeSeriesExplorer({
    ...oldParams,
    ...newParams
  })
}

export interface TimeSeriesComparatorParams {
  scenarioA: string
  scenarioB: string | null
  point: string
  variables: string[]
}

export function makePathToTimeSeriesComparator(params: TimeSeriesComparatorParams) {
  const vars = new Set(params.variables.map((v) => variableForPointOrFallback(params.point, v)))
  return `/simulation/timeSeries/comparator/${params.scenarioA}/${params.scenarioB ?? '_'}/${
    params.point
  }?vars=${encodeURIComponent(Array.from(vars).join(','))}`
}

export function makePathToTimeSeriesComparatorMerge(
  newParams: Partial<TimeSeriesComparatorParams>,
  oldParams: TimeSeriesComparatorParams
) {
  return makePathToTimeSeriesComparator({
    ...oldParams,
    ...newParams
  })
}

export interface TimeSeriesSingleExplorerParams {
  scenario: string
  point: string
  categories: string[]
}

export function makePathToTimeSeriesSingleExplorer(params: TimeSeriesSingleExplorerParams) {
  const p = pointGuardForDepthAboveGround(params.point)
  return `/simulation/timeSeries/single/${params.scenario}/${p}?categories=${encodeURIComponent(
    ensureAllCategoriesAreAvailableForPoint(p, params.categories).join(',')
  )}`
}

export function makePathToTimeSeriesSingleExplorerMerge(
  newParams: Partial<TimeSeriesSingleExplorerParams>,
  oldParams: TimeSeriesSingleExplorerParams
) {
  return makePathToTimeSeriesSingleExplorer({
    ...oldParams,
    ...newParams
  })
}

export interface TimeSeriesDepthExplorerParams {
  scenario: string
  point: string
  variables: string[]
}

export function makePathToTimeSeriesDepthExplorer(params: TimeSeriesDepthExplorerParams) {
  const p = pointGuardForDepthUnderground(params.point)
  const vars = new Set(params.variables.map((v) => variableForPointOrFallback(p, v)))
  return `/simulation/timeSeries/depth/${params.scenario}/${p}?vars=${encodeURIComponent(
    Array.from(vars).join(',')
  )}`
}

export function makePathToTimeSeriesDepthExplorerMerge(
  newParams: Partial<TimeSeriesDepthExplorerParams>,
  oldParams: TimeSeriesDepthExplorerParams
) {
  return makePathToTimeSeriesDepthExplorer({
    ...oldParams,
    ...newParams
  })
}

export function pointGuardForDepthAboveGround(point: string): string {
  return point.includes('underground') ? 'urban_canyon_windward_ground' : point
}

export function pointGuardForDepthUnderground(point: string): string {
  return point.includes('underground') ? point : 'urban_canyon_windward_underground'
}

export function variableForPointOrFallback(point: string, variableSlug?: string): string {
  const height = point.includes('underground') ? -1 : 1

  if (height < 0) {
    return 'SoilTemp'
  }
  if (variableSlug === 'SoilTemp') {
    return 'T'
  }
  return variableSlug ?? 'T'
}

export function ensureAllCategoriesAreAvailableForPoint(
  pointSlug: string,
  categories: string[]
): string[] {
  const notAboveGround = ['heat_fluxes', 'sw_radiation_horizontal', 'lw_radiation']
  if (!pointSlug.includes('ground')) {
    return categories.filter((c) => !notAboveGround.includes(c))
  }

  return categories
}
