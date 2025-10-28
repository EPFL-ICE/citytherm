import type { LayerSpecification, SourceSpecification } from 'maplibre-gl'

export type LegendColor = {
  color: string
  label: string
}

export type CustomLayerSpecification = LayerSpecification & { groupId: string }

export type LayerGroup = {
  id: string
  label: string
  expanded: boolean
  multiple: boolean
  layers: MapLayerConfig[]
}
export interface MapLayerConfig {
  id: string
  label: string
  unit: string
  info: string
  source: SourceSpecification
  layer: LayerSpecification
  hasDatePicker?: boolean
  isCategorical?: boolean
  legendColors?: LegendColor[]
}

export const cdnUrlOptions = {
  prod: 'https://enacit4r-cdn.epfl.ch/citytherm/2025-09-16',
  dev: ''
}

export const baseUrlOptions = {
  prod: `${cdnUrlOptions.prod}/geodata`,
  dev: '/geodata'
}

export const cdnUrl = import.meta.env.DEV ? cdnUrlOptions.dev : cdnUrlOptions.prod
export const baseUrl = import.meta.env.DEV ? baseUrlOptions.dev : baseUrlOptions.prod
