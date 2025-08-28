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

export const baseUrlOptions = {
  prod: 'https://enacit4r-cdn.epfl.ch/citytherm/2025-08-27/geodata',
  dev: '/geodata'
}

export const baseUrl = import.meta.env.DEV ? baseUrlOptions.dev : baseUrlOptions.prod
