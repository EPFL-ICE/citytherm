import { baseUrlOptions, baseUrl, type MapLayerConfig } from '@/config/layerTypes'
import type { LayerSpecification, VectorSourceSpecification } from 'maplibre-gl'
import type { CityKey } from '@/stores/city'

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

/* ---------------------------------
 *  Atomic layer array factories
 * ---------------------------------*/
export const urbanMorphologyLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'building_height',
      label: 'Building height [m]',
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
          'fill-opacity': 0.8
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
          'fill-opacity': 0.8
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
          'fill-opacity': 0.8
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
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    }
  ]
}

export const landCoverFractionLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
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
          'fill-opacity': 0.8
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
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    },
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
          'fill-opacity': 0.8
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
            0.2,
            '#c7e9b4',
            0.4,
            '#7fcdbb',
            0.6,
            '#41b6c4',
            0.8,
            '#2c7fb8',
            0.933,
            '#253494'
          ],
          'fill-opacity': 0.8
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
      label: 'Intersections [-]',
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
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    }
  ]
}

export const canyonLengthLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    // {
    //   id: 'length_ns',
    //   label: 'N-S',
    //   unit: 'm',
    //   info: 'Total length of north-south oriented streets',
    //   source: {
    //     type: 'vector',
    //     attribution: 'CityTherm Canyon Network Data',
    //     url: `pmtiles://${baseUrl}/${config.gridFile}`,
    //     minzoom: 5
    //   } as VectorSourceSpecification,
    //   layer: {
    //     id: 'length_ns-layer',
    //     type: 'fill',
    //     source: 'length_ns',
    //     'source-layer': config.sourceLayer,
    //     paint: {
    //       'fill-color': [
    //         'interpolate',
    //         ['linear'],
    //         ['to-number', ['get', 'Length N-S']],
    //         0,
    //         '#f7f7f7',
    //         200,
    //         '#d1e5f0',
    //         400,
    //         '#92c5de',
    //         600,
    //         '#4393c3',
    //         700,
    //         '#2166ac',
    //         852.78,
    //         '#053061'
    //       ],
    //       'fill-opacity': 0.8
    //     }
    //   } as LayerSpecification
    // },
    // {
    //   id: 'length_ne_sw',
    //   label: 'NE-SW',
    //   unit: 'm',
    //   info: 'Total length of northeast-southwest oriented streets',
    //   source: {
    //     type: 'vector',
    //     attribution: 'CityTherm Canyon Network Data',
    //     url: `pmtiles://${baseUrl}/${config.gridFile}`,
    //     minzoom: 5
    //   } as VectorSourceSpecification,
    //   layer: {
    //     id: 'length_ne_sw-layer',
    //     type: 'fill',
    //     source: 'length_ne_sw',
    //     'source-layer': config.sourceLayer,
    //     paint: {
    //       'fill-color': [
    //         'interpolate',
    //         ['linear'],
    //         ['to-number', ['get', 'Length NE-SW']],
    //         0,
    //         '#f7f7f7',
    //         200,
    //         '#d1e5f0',
    //         400,
    //         '#92c5de',
    //         600,
    //         '#4393c3',
    //         800,
    //         '#2166ac',
    //         1195.65,
    //         '#053061'
    //       ],
    //       'fill-opacity': 0.8
    //     }
    //   } as LayerSpecification
    // },
    // {
    //   id: 'length_se_nw',
    //   label: 'SE-NW',
    //   unit: 'm',
    //   info: 'Total length of southeast-northwest oriented streets',
    //   source: {
    //     type: 'vector',
    //     attribution: 'CityTherm Canyon Network Data',
    //     url: `pmtiles://${baseUrl}/${config.gridFile}`,
    //     minzoom: 5
    //   } as VectorSourceSpecification,
    //   layer: {
    //     id: 'length_se_nw-layer',
    //     type: 'fill',
    //     source: 'length_se_nw',
    //     'source-layer': config.sourceLayer,
    //     paint: {
    //       'fill-color': [
    //         'interpolate',
    //         ['linear'],
    //         ['to-number', ['get', 'Length SE-NW']],
    //         0,
    //         '#f7f7f7',
    //         200,
    //         '#d1e5f0',
    //         400,
    //         '#92c5de',
    //         600,
    //         '#4393c3',
    //         800,
    //         '#2166ac',
    //         978.55,
    //         '#053061'
    //       ],
    //       'fill-opacity': 0.8
    //     }
    //   } as LayerSpecification
    // },
    // {
    //   id: 'length_e_w',
    //   label: 'E-W',
    //   unit: 'm',
    //   info: 'Total length of east-west oriented streets',
    //   source: {
    //     type: 'vector',
    //     attribution: 'CityTherm Canyon Network Data',
    //     url: `pmtiles://${baseUrl}/${config.gridFile}`,
    //     minzoom: 5
    //   } as VectorSourceSpecification,
    //   layer: {
    //     id: 'length_e_w-layer',
    //     type: 'fill',
    //     source: 'length_e_w',
    //     'source-layer': config.sourceLayer,
    //     paint: {
    //       'fill-color': [
    //         'interpolate',
    //         ['linear'],
    //         ['to-number', ['get', 'Length E-W']],
    //         0,
    //         '#f7f7f7',
    //         200,
    //         '#d1e5f0',
    //         400,
    //         '#92c5de',
    //         600,
    //         '#4393c3',
    //         800,
    //         '#2166ac',
    //         1068.08,
    //         '#053061'
    //       ],
    //       'fill-opacity': 0.8
    //     }
    //   } as LayerSpecification
    // },
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
            '#f7f7f7',
            400,
            '#d1e5f0',
            800,
            '#92c5de',
            1200,
            '#4393c3',
            1600,
            '#2166ac',
            2005.83,
            '#053061'
          ],
          'fill-opacity': 0.8
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
            '#f7f7f7',
            400,
            '#d1e5f0',
            800,
            '#92c5de',
            1200,
            '#4393c3',
            1600,
            '#2166ac',
            2139.23,
            '#053061'
          ],
          'fill-opacity': 0.8
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
            '#f7f7f7',
            1,
            '#053061'
          ],
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    }
  ]
}

export const localClimateZoneLayers: MapLayerConfig[] = [
  {
    id: 'lcz_typology',
    label: 'Typology',
    unit: 'category',
    info: 'Local Climate Zone classification based on urban morphology',
    source: {
      type: 'vector',
      attribution: 'CityTherm Local Climate Zone Data',
      url: `pmtiles://${baseUrl}/local_climate_zones.pmtiles`,
      minzoom: 5
    } as VectorSourceSpecification,
    layer: {
      id: 'lcz_typology-layer',
      type: 'fill',
      source: 'lcz_typology',
      'source-layer': 'local_climate_zones',
      paint: {
        'fill-color': [
          'match',
          ['get', 'lcz_typology'],
          'LCZ1',
          '#8b0000', // Compact high-rise
          'LCZ2',
          '#cd5c5c', // Compact midrise
          'LCZ3',
          '#f4a460', // Compact low-rise
          'LCZ4',
          '#daa520', // Open high-rise
          'LCZ5',
          '#ffd700', // Open midrise
          'LCZ6',
          '#ffff00', // Open low-rise
          'LCZ7',
          '#c0c0c0', // Lightweight low-rise
          'LCZ8',
          '#696969', // Large low-rise
          'LCZ9',
          '#778899', // Sparsely built
          'LCZ10',
          '#2f4f4f', // Heavy industry
          'LCZA',
          '#228b22', // Dense trees
          'LCZB',
          '#90ee90', // Scattered trees
          'LCZC',
          '#adff2f', // Bush, scrub
          'LCZD',
          '#7cfc00', // Low plants
          'LCZE',
          '#000080', // Bare rock or paved
          'LCZF',
          '#4169e1', // Bare soil or sand
          'LCZG',
          '#0000ff', // Water
          '#cccccc' // Default
        ],
        'fill-opacity': 0.8
      }
    } as LayerSpecification
  }
]

export const irradianceLayers = (city: CityKey = 'geneva'): MapLayerConfig[] => {
  const config = getGridDataConfig(city)
  return [
    {
      id: 'irr_summer',
      label: 'Summer',
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
            ['to-number', ['get', 'solar_summer']],
            700,
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
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    },
    {
      id: 'irr_winter',
      label: 'Winter',
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
            ['to-number', ['get', 'solar_winter_2']],
            160,
            '#f7fbff',
            180,
            '#deebf7',
            200,
            '#c6dbef',
            220,
            '#9ecae1',
            240,
            '#6baed6',
            260,
            '#4292c6',
            280,
            '#2171b5',
            320,
            '#08519c',
            345,
            '#08306b'
          ],
          'fill-opacity': 0.8
        }
      } as LayerSpecification
    }
  ]
}

export const landSurfaceTemperatureLayers: MapLayerConfig[] = [
  {
    id: 'lst_measurement',
    label: 'Measurement',
    unit: '°C',
    info: 'Land surface temperature measurements from satellite data',
    hasDatePicker: true,
    source: {
      type: 'vector',
      attribution: 'CityTherm Land Surface Temperature Data',
      url: `pmtiles://${baseUrl}/land_surface_temperature.pmtiles`,
      minzoom: 5
    } as VectorSourceSpecification,
    layer: {
      id: 'lst_measurement-layer',
      type: 'fill',
      source: 'lst_measurement',
      'source-layer': 'land_surface_temperature',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['to-number', ['get', 'lst_measurement']],
          10,
          '#313695',
          15,
          '#4575b4',
          20,
          '#74add1',
          25,
          '#abd9e9',
          30,
          '#e0f3f8',
          35,
          '#ffffbf',
          40,
          '#fee090',
          45,
          '#fdae61',
          50,
          '#f46d43',
          55,
          '#d73027',
          60,
          '#a50026'
        ],
        'fill-opacity': 0.8
      }
    } as LayerSpecification
  }
]

/* ---------------------------------
 *  Layer-group configuration
 * ---------------------------------*/
export const getLayerGroups = (city: CityKey = 'geneva') => [
  {
    id: 'urban_morphology',
    label: 'Urban morphology',
    expanded: true, // open by default (matches mock-up)
    multiple: false, // radio-button style
    layers: urbanMorphologyLayers(city)
  },
  {
    id: 'land_cover_fraction',
    label: 'Land cover fraction',
    expanded: false,
    multiple: false,
    layers: landCoverFractionLayers(city)
  },
  {
    id: 'canyon_network',
    label: 'Canyon network',
    expanded: false,
    multiple: true, // check-box style (lengths + intersections)
    layers: [
      //  ...canyonIntersectionLayers(city),
       ...canyonLengthLayers(city)]
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
    layers: irradianceLayers(city)
  },
  {
    id: 'land_surface_temperature',
    label: 'Land surface temperature',
    expanded: false,
    multiple: false,
    layers: landSurfaceTemperatureLayers
  }
]

export const getMapConfig = (city: CityKey = 'geneva') => ({
  baseUrl: baseUrlOptions,
  layers: [
    ...urbanMorphologyLayers(city),
    ...landCoverFractionLayers(city),
    ...canyonIntersectionLayers(city),
    ...canyonLengthLayers(city),
    ...localClimateZoneLayers,
    ...irradianceLayers(city),
    ...landSurfaceTemperatureLayers
  ] as MapLayerConfig[]
})

// For backward compatibility, export default config for Geneva
export const mapConfig = getMapConfig('geneva')
export const layerGroups = getLayerGroups('geneva')
