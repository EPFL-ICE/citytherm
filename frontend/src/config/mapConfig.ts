import { baseUrl, baseUrlOptions, type MapLayerConfig } from '@/config/layerTypes'
import type { CityKey } from '@/stores/city'
import type { LayerSpecification, VectorSourceSpecification } from 'maplibre-gl'

/* ---------------------------------
 *  Dynamic layer configuration
 * ---------------------------------*/

// Get the grid data configuration for a specific city
function getGridDataConfig(city: CityKey) {
  const configs = {
    geneva: {
      gridFile: 'geneva_grid_data.pmtiles',
      sourceLayer: 'geneva_grid_data_reprojected'
    },
    zurich: {
      gridFile: 'zurich_grid_data.pmtiles',
      sourceLayer: 'zurich_grid_data_reprojected'
    }
  }
  return configs[city]
}

// URBAN MORPHOLOGY
// Typology
// Building height
// Sky view factor
// Frontal area index
// Aspect ratio

// LAND COVER FRACTION
// Building
// Impervious
// Pervious
// Water

// ROADS
// Intersections
// Primary road
// Secondary road
// Highway

// CLIMATIC CONDITIONS
// Irradiance - summer
// Irradiance -winter

// URBAN ENVIRONMENT
// Land surface temeprature

/* ---------------------------------
 *  Atomic layer array factories
 * ---------------------------------*/
export const urbanMorphologyLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'building_height',
      label: 'Building height',
      unit: 'm',
      info: 'Average height of buildings in each grid cell',
      source: {
        type: 'vector',
        attribution: 'CityTherm Urban Morphology Data',
        // url: `pmtiles://${baseUrl}/urban_morphology.pmtiles`,
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'building_height-layer',
        type: 'fill',
        source: 'building_height',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Building height']],
            0,
            '#f7f7f7',
            10,
            '#d1e5f0',
            20,
            '#92c5de',
            30,
            '#4393c3',
            40,
            '#2166ac',
            50,
            '#053061'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'sky_view_factor',
      label: 'Sky view factor',
      unit: 'ratio',
      info: 'Fraction of sky visible from ground level',
      source: {
        type: 'vector',
        attribution: 'CityTherm Urban Morphology Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'sky_view_factor-layer',
        type: 'fill',
        source: 'sky_view_factor',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Sky view factor']],
            0.4,
            '#053061',
            0.5,
            '#2166ac',
            0.6,
            '#4393c3',
            0.7,
            '#92c5de',
            0.8,
            '#d1e5f0',
            1,
            '#f7f7f7'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'frontal_area',
      label: 'Frontal area index',
      unit: 'ratio',
      info: 'Frontal area index of buildings facing the wind',
      source: {
        type: 'vector',
        attribution: 'CityTherm Urban Morphology Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'frontal_area-layer',
        type: 'fill',
        source: 'frontal_area',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Frontal area index']],
            0,
            '#f7f7f7',
            0.1,
            '#d1e5f0',
            0.2,
            '#92c5de',
            0.3,
            '#4393c3',
            0.4,
            '#2166ac',
            0.6,
            '#053061'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'aspect_ratio',
      label: 'Aspect ratio',
      unit: 'ratio',
      info: 'Ratio of building height to street width',
      source: {
        type: 'vector',
        attribution: 'CityTherm Urban Morphology Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'aspect_ratio-layer',
        type: 'fill',
        source: 'aspect_ratio',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Aspect ratio']],
            0,
            '#f7f7f7',
            0.2,
            '#d1e5f0',
            0.4,
            '#92c5de',
            0.6,
            '#4393c3',
            0.8,
            '#2166ac',
            1.356,
            '#053061'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

export const landCoverFractionLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'building_fraction',
      label: 'Building',
      unit: 'fraction',
      info: 'Fraction of cell area covered by buildings',
      source: {
        type: 'vector',
        attribution: 'CityTherm Land Cover Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'building_fraction-layer',
        type: 'fill',
        source: 'building_fraction',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Building cover fraction']],
            0,
            '#f7f7f7',
            0.1,
            '#fcae91',
            0.2,
            '#fb6a4a',
            0.3,
            '#de2d26',
            0.4,
            '#a50f15',
            0.62,
            '#67000d'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'impervious_fraction',
      label: 'Impervious',
      unit: 'fraction',
      info: 'Fraction of cell area covered by impervious surfaces',
      source: {
        type: 'vector',
        attribution: 'CityTherm Land Cover Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'impervious_fraction-layer',
        type: 'fill',
        source: 'impervious_fraction',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Impervious surface cover fraction']],
            0,
            '#f7f7f7',
            0.2,
            '#d9d9d9',
            0.4,
            '#969696',
            0.6,
            '#636363',
            0.796,
            '#252525',
            0.8,
            '#000000'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'pervious_fraction',
      label: 'Pervious',
      unit: 'fraction',
      info: 'Fraction of cell area covered by pervious surfaces',
      source: {
        type: 'vector',
        attribution: 'CityTherm Land Cover Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'pervious_fraction-layer',
        type: 'fill',
        source: 'pervious_fraction',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Pervious surface cover fraction']],
            0,
            '#f7f7f7',
            0.933,
            '#00550dff'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'water_fraction',
      label: 'Water',
      unit: 'fraction',
      info: 'Fraction of cell area covered by water bodies',
      source: {
        type: 'vector',
        attribution: 'CityTherm Land Cover Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'water_fraction-layer',
        type: 'fill',
        source: 'water_fraction',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Water cover fraction']],
            0,
            '#f7f7f7',
            0.2,
            '#c6dbef',
            0.4,
            '#6baed6',
            0.6,
            '#2171b5',
            0.8,
            '#08519c',
            1,
            '#08306b'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

export const canyonIntersectionLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'intersections',
      label: 'Intersections',
      unit: 'count',
      info: 'Number of street intersections per grid cell',
      source: {
        type: 'vector',
        attribution: 'CityTherm Canyon Network Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'intersections-layer',
        type: 'fill',
        source: 'intersections',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Intersections']],
            0,
            '#f7f7f7',
            5,
            '#d1e5f0',
            10,
            '#92c5de',
            15,
            '#4393c3',
            25,
            '#2166ac',
            35,
            '#053061'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

export const canyonLengthLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'primary_road_len',
      label: 'Primary road',
      unit: 'm',
      info: 'Total length of primary roads',
      source: {
        type: 'vector',
        attribution: 'CityTherm Canyon Network Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'primary_road_len-layer',
        type: 'fill',
        source: 'primary_road_len',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Length primary road']],
            0,
            '#000000ff',
            2333.49,
            '#f7f7f7'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'secondary_road_len',
      label: 'Secondary road',
      unit: 'm',
      info: 'Total length of secondary roads',
      source: {
        type: 'vector',
        attribution: 'CityTherm Canyon Network Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'secondary_road_len-layer',
        type: 'fill',
        source: 'secondary_road_len',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Length secondary road']],
            0,
            '#000000ff',
            2304.66,
            '#f7f7f7'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'highway_len',
      label: 'Highway',
      unit: 'm',
      info: 'Total length of highways',
      source: {
        type: 'vector',
        attribution: 'CityTherm Canyon Network Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'highway_len-layer',
        type: 'fill',
        source: 'highway_len',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Length highway']],
            0,
            '#000000ff',
            941,
            '#f7f7f7'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

export const localClimateZoneLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'lcz_typology',
      label: 'Typology',
      unit: 'category',
      info: 'Local Climate Zone classification based on urban morphology',
      isCategorical: true,
      legendColors: [
        { color: '#D9081C', label: 'LCZ 2 - Compact midrise' },
        { color: '#FF6628', label: 'LCZ 5 - Open midrise' },
        { color: '#FF985E', label: 'LCZ 6 - Open lowrise' },
        { color: '#FFCBAB', label: 'LCZ 9 - Sparsely built' },
        { color: '#006A18', label: 'LCZ 11 (A) - Dense trees' },
        { color: '#00A926', label: 'LCZ 12 (B) - Scattered trees' },
        { color: '#B5DA7F', label: 'LCZ 14 (D) - Low plants' },
        { color: '#656BFA', label: 'LCZ 17 (G) - Water' },
        { color: '#BBBBBB', label: 'LCZ 8 - Large low-rise' }
      ],
      source: {
        type: 'vector',
        attribution: 'CityTherm Local Climate Zone Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'lcz_typology-layer',
        type: 'fill',
        source: 'lcz_typology',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

export const defaultGridLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'baselayer',
      label: 'Base Layer',
      unit: 'category',
      info: 'Base layer for the grid data',
      source: {
        type: 'vector',
        attribution: 'CityTherm Local Climate Zone Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'baselayer',
        type: 'fill',
        source: 'baselayer',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': '#FFFFFF',
          'fill-opacity': 0.8,
          'fill-outline-color': '#000000'
        }
      } as LayerSpecification
    }
  ]
}

export const irradianceLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  // CLIMATIC CONDITIONS
  // Irradiance - summer
  // Irradiance - winter
  return [
    {
      id: 'irr_summer',
      label: 'Irradiance - summer',
      unit: 'kWh/m²',
      info: 'Solar irradiance during summer months',
      source: {
        type: 'vector',
        attribution: 'CityTherm Irradiance Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'irr_summer-layer',
        type: 'fill',
        source: 'irr_summer',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Irradiance_S']],
             600,
            '#ffffcc',
            750,
            '#ffeda0',
            800,
            '#fed976',
            850,
            '#feb24c',
            900,
            '#fd8d3c',
            950,
            '#fc4e2a',
            1000,
            '#e31a1c',
            1050,
            '#bd0026',
            1075,
            '#800026'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    },
    {
      id: 'irr_winter',
      label: 'Irradiance - winter',
      unit: 'kWh/m²',
      info: 'Solar irradiance during winter months',
      source: {
        type: 'vector',
        attribution: 'CityTherm Irradiance Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'irr_winter-layer',
        type: 'fill',
        source: 'irr_winter',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'Irradiance_W']],
            100, '#ffffcc',
130.6, '#ffeda0',
161.2, '#fed976',
191.8, '#feb24c',
222.4, '#fd8d3c',
253.0, '#fc4e2a',
283.6, '#e31a1c',
314.2, '#bd0026',
345, '#800026'
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffffff', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
  ]
}

// LST_mean

export const landSurfaceTemperatureLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)

  // Define city-specific interpolation values
  const interpolationValues = {
    geneva: [
      22.8,
      '#313695',
      25.67,
      '#4575b4',
      28.53,
      '#74add1',
      31.4,
      '#abd9e9',
      34.27,
      '#e0f3f8',
      37.13,
      '#ffffbf',
      40.04,
      '#a50026'
    ],
    zurich: [
      27.13,
      '#313695',
      29.59,
      '#4575b4',
      32.05,
      '#74add1',
      34.51,
      '#abd9e9',
      36.97,
      '#e0f3f8',
      39.43,
      '#ffffbf',
      44.69,
      '#a50026'
    ]
  }

  return [
    {
      id: 'LST_mean',
      label: 'Land surface temperature',
      unit: '°C',
      info: 'Land surface temperature',
      hasDatePicker: true,
      source: {
        type: 'vector',
        name: 'LST_mean',
        attribution: 'CityTherm Land Surface Temperature Data',
        url: `pmtiles://${baseUrl}/${config.gridFile}`,
        minzoom: 5
      } as VectorSourceSpecification,
      layer: {
        id: 'LST_mean-layer',
        type: 'fill',
        source: 'LST_mean',
        'source-layer': config.sourceLayer,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'LST_mean']],
            ...interpolationValues[city]
          ],
          'fill-opacity': 0.8,
          'fill-outline-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ff0000', // White outline when hovered
            '#000000' // Black outline normally
          ]
        }
      } as LayerSpecification
    }
    // {
    //   id: 'lst_geotiff',
    //   label: 'GeoTIFF',
    //   unit: '°C',
    //   info: 'Land surface temperature from GeoTIFF files',
    //   hasDatePicker: true,
    //   source: {
    //     type: 'raster',
    //     attribution: 'CityTherm Land Surface Temperature Data',
    //     tiles: [`/geodata/lst/{z}/{x}/{y}.png`], // Placeholder - will be handled by GeoTIFF component
    //     minzoom: 5,
    //     maxzoom: 15
    //   } as any,
    //   layer: {
    //     id: 'lst_geotiff-layer',
    //     type: 'raster',
    //     source: 'lst_geotiff',
    //     paint: {
    //       'raster-opacity': 0.8
    //     }
    //   } as LayerSpecification
    // }
  ]
}

/* ---------------------------------
 *  Layer-group configuration
 * ---------------------------------*/
export const getLayerGroups = (city: CityKey = 'geneva') => [
  {
    id: 'urban_morphology',
    label: 'Urban morphology',
    expanded: true, // open by default (matches mock-up)
    multiple: false, // radio-button style
    layers: [
      // Place Local Climate Zone typology at the top of Urban morphology as requested
      ...localClimateZoneLayers(city),
      ...urbanMorphologyLayers(city)
    ]
  },
  {
    id: 'land_cover_fraction',
    label: 'Land cover fraction',
    expanded: true,
    multiple: false,
    layers: landCoverFractionLayers(city)
  },
  {
    id: 'roads',
    label: 'Roads',
    expanded: true,
    multiple: true, // check-box style (lengths + intersections)
    layers: [
      // Ensure intersections are listed first, followed by road lengths
      ...canyonIntersectionLayers(city),
      ...canyonLengthLayers(city)
    ]
  },
  {
    id: 'irradiance',
    label: 'CLIMATIC CONDITIONS',
    expanded: true,
    multiple: false,
    layers: irradianceLayers(city)
  },
  // URBAN ENVIRONMENT
  // Land surface temperature
  {
    id: 'land_surface_temperature',
    label: 'URBAN ENVIRONMENT',
    expanded: true,
    multiple: true,
    layers: landSurfaceTemperatureLayers(city)
  }
]

export const getMapConfig = (city: CityKey = 'geneva') => ({
  baseUrl: baseUrlOptions,
  layers: [
    ...defaultGridLayers(city),
    // Urban morphology (place LCZ typology first inside the group)
    ...localClimateZoneLayers(city),
    ...urbanMorphologyLayers(city),
    // Land cover fraction (ordered: Building, Impervious, Pervious, Water)
    ...landCoverFractionLayers(city),
    // Roads: intersections first, then road lengths
    ...canyonIntersectionLayers(city),
    ...canyonLengthLayers(city),
    // Climatic conditions: irradiance (summer, winter)
    ...irradianceLayers(city),
    // Urban environment: land surface temperature
    ...landSurfaceTemperatureLayers(city)
  ] as MapLayerConfig[]
})

// For backward compatibility, export default config for Geneva
export const mapConfig = getMapConfig('geneva')
export const layerGroups = getLayerGroups('geneva')
