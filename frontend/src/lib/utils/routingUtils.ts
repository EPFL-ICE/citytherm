export interface SlicePageParams {
  scenarioA: string
  scenarioB: string | null
  plane: string
  time: string
  variables: string[]
}

export function makePathToSlice(params: SlicePageParams) {
  return `/simulation/plane/${params.scenarioA}/${params.scenarioB ?? '_'}/${params.plane}/${
    params.time
  }?vars=${encodeURIComponent(params.variables.join(','))}`
}

export function makePathToSliceMerge(
  newParams: Partial<SlicePageParams>,
  oldParams: SlicePageParams
) {
  return makePathToSlice({
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
