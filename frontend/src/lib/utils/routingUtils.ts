export interface ScenarioPickerParams {
  scenario: string | null
  plane: string | null
}

export function makePathToScenarioPicker(params: ScenarioPickerParams) {
  const scenarioStr = params.scenario ? `scenarios=${params.scenario}` : ''
  return `/simulation?${scenarioStr}&plane=${params.plane ?? '_'}`
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

export interface PlanePageParams {
  scenarioA: string
  scenarioB: string | null
  plane: string
  time: string
  variables: string[]
}

export function makePathToPlane(params: PlanePageParams) {
  return `/simulation/plane/${params.scenarioA}/${params.scenarioB ?? '_'}/${params.plane}/${
    params.time
  }?vars=${encodeURIComponent(params.variables.join(','))}`
}

export function makePathToPlaneMerge(
  newParams: Partial<PlanePageParams>,
  oldParams: PlanePageParams
) {
  return makePathToPlane({
    ...oldParams,
    ...newParams
  })
}

export interface TimeSeriesPageParams {
  scenarioA: string
  scenarioB: string | null
  point: string
  variables: string[]
}

export function makePathToTimeSeries(params: TimeSeriesPageParams) {
  return `/simulation/timeSeries/${params.scenarioA}/${params.scenarioB ?? '_'}/${
    params.point
  }?vars=${encodeURIComponent(params.variables.join(','))}`
}

export function makePathToTimeSeriesMerge(
  newParams: Partial<TimeSeriesPageParams>,
  oldParams: TimeSeriesPageParams
) {
  return makePathToTimeSeries({
    ...oldParams,
    ...newParams
  })
}
