import { baseUrlOptions, type MapLayerConfig } from '@/config/layerTypes'


/* ---------------------------------
 *  Atomic layer arrays
 * ---------------------------------*/
export const urbanMorphologyLayers = [
  { id: 'building_height',   label: 'Building height [m]' },
  { id: 'sky_view_factor',   label: 'Sky view factor' },
  { id: 'frontal_area',      label: 'Frontal area [m²]' },
  { id: 'aspect_ratio',      label: 'Aspect ratio' }
];

export const landCoverFractionLayers = [
  { id: 'water_fraction',    label: 'Water' },
  { id: 'impervious_fraction', label: 'Impervious' },
  { id: 'building_fraction', label: 'Building' },
  { id: 'pervious_fraction', label: 'Pervious' }
];

export const canyonIntersectionLayers = [
  { id: 'intersections',     label: 'Intersections [-]' }
];

export const canyonLengthLayers = [
  { id: 'length_ns',         label: 'N-S' },
  { id: 'length_ne_sw',      label: 'NE-SW' },
  { id: 'length_se_nw',      label: 'SE-NW' },
  { id: 'length_e_w',        label: 'E-W' },
  { id: 'primary_road_len',  label: 'Primary road' },
  { id: 'secondary_road_len',label: 'Secondary road' },
  { id: 'highway_len',       label: 'Highway' }
];

export const localClimateZoneLayers = [
  { id: 'lcz_typology',      label: 'Typology' }
];

export const irradianceLayers = [
  { id: 'irr_summer',        label: 'Summer' },
  { id: 'irr_winter',        label: 'Winter' }
];

export const landSurfaceTemperatureLayers = [
  { id: 'lst_measurement',   label: 'Measurement', hasDatePicker: true }
];

/* ---------------------------------
 *  Layer-group configuration
 * ---------------------------------*/
export const layerGroups = [
  {
    id: 'urban_morphology',
    label: 'Urban morphology',
    expanded: true,          // open by default (matches mock-up)
    multiple: false,         // radio-button style
    layers: urbanMorphologyLayers
  },
  {
    id: 'land_cover_fraction',
    label: 'Land cover fraction',
    expanded: false,
    multiple: false,
    layers: landCoverFractionLayers
  },
  {
    id: 'canyon_network',
    label: 'Canyon network',
    expanded: false,
    multiple: true,          // check-box style (lengths + intersections)
    layers: [
      ...canyonIntersectionLayers,
      ...canyonLengthLayers
    ]
  },
  {
    id: 'local_climate_zones',
    label: 'Local climate zones',
    expanded: false,
    multiple: false,
    layers: localClimateZoneLayers
  },
  {
    id: 'irradiance',
    label: 'Irradiance [kWh/m²]',
    expanded: false,
    multiple: false,
    layers: irradianceLayers
  },
  {
    id: 'land_surface_temperature',
    label: 'Land surface temperature',
    expanded: false,
    multiple: false,
    layers: landSurfaceTemperatureLayers
  }
];



export const mapConfig = {
  baseUrl: baseUrlOptions,
  layers: [
    ...urbanMorphologyLayers,
    ...landCoverFractionLayers,
    ...canyonIntersectionLayers,
    ...canyonLengthLayers,
    ...localClimateZoneLayers,
    ...irradianceLayers,
    ...landSurfaceTemperatureLayers,
  ] as MapLayerConfig[]
}



// export const layerGroups = [
//   {
//     id: 'sp0_migration',
//     label: 'SP0 Migration',
//     expanded: false,
//     multiple: false,
//     layers: sp0MigrationLayers
//   },
//   {
//     id: 'sp2_mobility',
//     label: 'SP2 Mobility',
//     expanded: false,
//     multiple: false,
//     layers: sp2MobilityLayers
//   },
//   {
//     id: 'sp3_nature',
//     label: 'SP3 Nature',
//     expanded: false,
//     multiple: false,
//     layers: sp3NatureLayers
//   },
//   { id: 'sp4_waste', label: 'SP4 Waste', expanded: false, multiple: true, layers: sp4WasteLayers },
//   {
//     id: 'sp6_materials',
//     label: 'SP6 Materials',
//     expanded: false,
//     multiple: false,
//     layers: sp6MaterialsLayers
//   },
//   { id: 'sp7', label: 'SP7 Goods', expanded: false, multiple: false, layers: sp7VehicleLayers },
//   ...correlationLayerGroups
//   // Add other groups as needed
// ]
