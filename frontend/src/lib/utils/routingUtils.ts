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
  return `/simulation/plane/explorer/${params.plane}/${params.time}/${params.variable}?scenarios=${encodeURIComponent(
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
  return `/simulation/plane/single/${params.plane}/${params.time}/${params.scenario}?vars=${encodeURIComponent(
    params.variables.join(',')
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
  return `/simulation/plane/comparator/${params.scenarioA}/${params.scenarioB ?? '_'}/${params.plane}/${
    params.time
  }?vars=${encodeURIComponent(params.variables.join(','))}`
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
  const scenarios = [...params.scenarios]
  if (!scenarios.includes('S0')) {
    scenarios.unshift('S0')
  }
  return `/simulation/timeSeries/explorer/${
    params.point
  }?vars=${encodeURIComponent(params.variables.join(','))}&scenarios=${encodeURIComponent(scenarios.join(','))}`
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
  return `/simulation/timeSeries/comparator/${params.scenarioA}/${params.scenarioB ?? '_'}/${
    params.point
  }?vars=${encodeURIComponent(params.variables.join(','))}`
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
  return `/simulation/timeSeries/single/${params.scenario}/${params.point}?categories=${encodeURIComponent(
    params.categories.join(',')
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
