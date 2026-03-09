import { mdiChartTimelineVariant, mdiMapClock, mdiFormatListGroup, mdiChartMultiple, mdiDatabaseSearch, mdiCompass, mdiTuneVariant, mdiCompareHorizontal, mdiChartPpf } from '@mdi/js'

export interface GraphKindDescription {
  name: string
  shortName: string
  description: string
  icon: string
  slug: GraphKind
  multipleScenarios: boolean
  multipleVariables: boolean
  locator: "plane" | "point"
  locationRealm: GraphLocationRealm
}

export interface GraphKindGroup {
  name: string
  description: string
  icon: string

  kinds: GraphKind[]
}

export type GraphLocationRealm = "both" | "below-ground" | "above-ground"

export type GraphKind = keyof typeof graphKindsDescriptions

export const graphKindsDescriptions = {
  'heatmap-scenarios': {
    name: 'Explore scenarios',
    shortName: 'Heatmap explore',
    description: 'one variable, many scenarios',
    slug: 'heatmap-scenarios',
    icon: mdiCompass,
    multipleScenarios: true,
    multipleVariables: false,
    locator: 'plane',
    locationRealm: "both"
  },
  'heatmap-variables': {
    name: 'Explore variables',
    shortName: 'Heatmap analyze',
    description: 'one scenario, many variables',
    slug: 'heatmap-variables',
    icon: mdiTuneVariant,
    multipleScenarios: false,
    multipleVariables: true,
    locator: 'plane',
    locationRealm: "both"
  },
  'heatmap-compare-scenarios': {
    name: 'Compare 2 scenarios',
    shortName: 'Heatmap compare',
    description: 'difference between 2 scenarios, many variables',
    slug: 'heatmap-compare-scenarios',
    icon: mdiCompareHorizontal,
    multipleScenarios: true,
    multipleVariables: true,
    locator: 'plane',
    locationRealm: "both"
  },
  'temporal-explore-data': {
    name: 'Explore data',
    shortName: 'Temporal explore',
    description: 'many scenarios, many variables',
    slug: 'temporal-explore-data',
    icon: mdiDatabaseSearch,
    multipleScenarios: true,
    multipleVariables: true,
    locator: 'point',
    locationRealm: "both"
  },
  'temporal-compare-scenarios': {
    name: 'Compare 2 scenarios',
    shortName: 'Temporal compare',
    description: 'difference between 2 scenarios, many variables',
    slug: 'temporal-compare-scenarios',
    icon: mdiChartMultiple,
    multipleScenarios: true,
    multipleVariables: true,
    locator: 'point',
    locationRealm: "above-ground"
  },
  'temporal-explore-categories': {
    name: 'Plot groups of variables',
    shortName: 'Temporal categories',
    description: 'one scenario, many groups of above-ground variables',
    slug: 'temporal-explore-categories',
    icon: mdiFormatListGroup,
    multipleScenarios: false,
    multipleVariables: true,
    locator: 'point',
    locationRealm: "above-ground"
  },
  'temporal-explore-depth': {
    name: 'Depth plot',
    shortName: 'Temporal depth',
    description: 'one scenario, one below-ground variable, many depth levels',
    slug: 'temporal-explore-depth',
    icon: mdiChartPpf,
    multipleScenarios: false,
    multipleVariables: false,
    locator: 'point',
    locationRealm: "below-ground"
  }
} as const

export const graphKindGroups: GraphKindGroup[] = [
  {
    name: 'Heatmap (2D plane)',
    description: '',
    icon: mdiMapClock,
    kinds: [
      'heatmap-scenarios',
      'heatmap-variables',
      'heatmap-compare-scenarios'
    ]
  },
  {
    name: 'Temporal (1D time series on one point)',
    description: '',
    icon: mdiChartTimelineVariant,
    kinds: [
      'temporal-explore-data',
      'temporal-compare-scenarios',
      'temporal-explore-categories',
      'temporal-explore-depth'
    ]
  }
]