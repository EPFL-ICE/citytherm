import type { Map as MapLibre, MapLayerMouseEvent } from 'maplibre-gl'
import { Popup as MapLibrePopup } from 'maplibre-gl'
import { onUnmounted, ref, type Ref } from 'vue'
import { useFeatureSelections } from '@/stores/useFeatureSelections'

// Interface for tracking attached event listeners
interface EventListeners {
  [key: string]: {
    click?: (e: MapLayerMouseEvent) => void
    mousemove?: (e: MapLayerMouseEvent) => void
    mouseleave?: () => void
  }
}

// Mapping of layer groups to their relevant properties
const layerGroupProperties: Record<string, string[]> = {
  urban_morphology: ['Building height', 'Sky view factor', 'Frontal area index', 'Aspect ratio'],
  land_cover_fraction: [
    'Water cover fraction',
    'Impervious surface cover fraction',
    'Building cover fraction',
    'Pervious surface cover fraction'
  ],
  canyon_network: ['Length primary road', 'Length secondary road', 'Length highway'],
  local_climate_zones: ['lcz_typology'],
  irradiance: ['solar_summer', 'solar_winter_2'],
  land_surface_temperature: ['lst_measurement']
}

// Helper function to get layer group ID from layer ID
function getLayerGroupId(layerId: string): string | null {
  // Remove '-layer' suffix if present
  const baseLayerId = layerId.replace('-layer', '')

  // Map layer IDs to group IDs
  const layerToGroupMap: Record<string, string> = {
    building_height: 'urban_morphology',
    sky_view_factor: 'urban_morphology',
    frontal_area: 'urban_morphology',
    aspect_ratio: 'urban_morphology',
    water_fraction: 'land_cover_fraction',
    impervious_fraction: 'land_cover_fraction',
    building_fraction: 'land_cover_fraction',
    pervious_fraction: 'land_cover_fraction',
    // intersections: 'canyon_network',
    // length_ns: 'canyon_network',
    // length_ne_sw: 'canyon_network',
    // length_se_nw: 'canyon_network',
    // length_e_w: 'canyon_network',
    primary_road_len: 'canyon_network',
    secondary_road_len: 'canyon_network',
    highway_len: 'canyon_network',
    lcz_typology: 'local_climate_zones',
    irr_summer: 'irradiance',
    irr_winter: 'irradiance',
    lst_measurement: 'land_surface_temperature'
  }

  return layerToGroupMap[baseLayerId] || null
}

// Helper function to format popup content
function formatPopupContent(
  properties: Record<string, any> | null,
  label: string,
  layerId: string
): string {
  if (!properties) return 'No data available'

  // Get the layer group ID
  const layerGroupId = getLayerGroupId(layerId)

  // Get relevant properties for this layer group, or all properties if no group found
  const relevantProperties = layerGroupId ? layerGroupProperties[layerGroupId] : null

  // Always include these specific properties in the header
  const headerProperties = ['id', 'col_index', 'row_index']

  // Create header content with ID and coordinates
  let headerContent = `${label}`
  if (properties) {
    const id = properties['id']
    const colIndex = properties['col_index']
    const rowIndex = properties['row_index']

    if (id !== undefined || colIndex !== undefined || rowIndex !== undefined) {
      headerContent += ' ('
      const parts = []
      if (id !== undefined) parts.push(`ID: ${id}`)
      if (colIndex !== undefined) parts.push(`Col: ${colIndex}`)
      if (rowIndex !== undefined) parts.push(`Row: ${rowIndex}`)
      headerContent += parts.join(', ') + ')'
    }
  }

  // Create HTML table to display properties
  let content = `<div class="popup-content"><h3>${headerContent}</h3><table class="popup-table">`

  // Get properties to display - only relevant properties, excluding header properties
  const propertiesToDisplay = relevantProperties
    ? Object.entries(properties).filter(
        ([key]) => relevantProperties.includes(key) && !headerProperties.includes(key)
      )
    : Object.entries(properties).filter(([key]) => !headerProperties.includes(key))

  // Filter out null/undefined values and internal properties
  propertiesToDisplay
    .filter(([key, value]) => value !== null && value !== undefined && !key.startsWith('_'))
    .forEach(([key, value]) => {
      // Format the property key to be more readable
      const formattedKey = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Format the value based on its type
      let formattedValue = value
      if (typeof value === 'number') {
        // Format numbers with up to 2 decimal places
        formattedValue = Math.round(value * 100) / 100
      }

      content += `
        <tr>
          <td class="property-name">${formattedKey}</td>
          <td class="property-value">${formattedValue}</td>
        </tr>
      `
    })

  content += '</table></div>'
  return content
}

// Type definition for the return type to avoid inference issues
interface MapEventsReturn {
  hoveredFeature: Ref<Record<string, any> | null>
  selectedFeatureId: Ref<string | undefined>
  attachPopupListeners: (layerId: string, layerLabel: string) => void
  detachPopupListeners: (layerId: string) => void
  detachAllPopupListeners: () => void
  cleanup: () => void
}

/**
 * Composable for managing map layer event listeners and popups
 */
export function useMapEvents(
  mapRef: Ref<MapLibre | undefined>,
  popupOptions = {}
): MapEventsReturn {
  // State refs exposed by the composable
  const hoveredFeature = ref<Record<string, any> | null>(null)
  const selectedFeatureId = ref<string | undefined>(undefined)

  // Private state
  const currentFeatureId = ref<string | undefined>(undefined)
  const attachedEventListeners: EventListeners = {}

  // Initialize the hover popup with default + custom options
  const hoverPopup = new MapLibrePopup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: '500px',
    className: 'feature-popup',
    ...popupOptions
  })

  // Get the selections store
  const featureSelections = useFeatureSelections()

  /**
   * Handle layer click events
   */
  function handleLayerClick(_layerId: string, layerLabel: string, e: MapLayerMouseEvent): void {
    if (!e.features || e.features.length === 0 || !mapRef.value) return

    const feature = e.features[0]

    // Handle selection if this is a selectable layer
    // For now, we'll assume all layers can be selected
    // In a more sophisticated implementation, we might want to check if the layer is in a specific list
    featureSelections.toggleFromFeature(feature, 'id')

    // Generate unique ID for clicked feature
    const featureId =
      feature.id?.toString() ||
      JSON.stringify(feature.properties) +
        (feature.geometry.type === 'Point'
          ? feature.geometry.coordinates.toString()
          : e.lngLat.toString())

    // Save this as the selected feature
    selectedFeatureId.value = featureId
    hoveredFeature.value = feature.properties

    // Stop event propagation
    e.preventDefault()
  }

  /**
   * Handle layer mousemove events
   */
  function handleLayerMouseMove(_layerId: string, layerLabel: string, e: MapLayerMouseEvent): void {
    if (!e.features || e.features.length === 0 || !mapRef.value) return

    const feature = e.features[0]
    mapRef.value.getCanvas().style.cursor = 'pointer'

    // Generate a unique ID for this feature
    const featureId =
      feature.id?.toString() ||
      JSON.stringify(feature.properties) +
        (feature.geometry.type === 'Point'
          ? feature.geometry.coordinates.toString()
          : e.lngLat.toString())

    // Only update if we've moved to a different feature
    if (currentFeatureId.value !== featureId) {
      currentFeatureId.value = featureId
      hoveredFeature.value = feature.properties

      // Format popup content
      const popupContent = formatPopupContent(feature.properties, layerLabel, _layerId)

      hoverPopup.setLngLat(e.lngLat).setHTML(popupContent).addTo(mapRef.value)
    }
  }

  /**
   * Handle layer mouseleave events
   */
  function handleLayerMouseLeave(): void {
    if (!mapRef.value) return
    mapRef.value.getCanvas().style.cursor = ''
    currentFeatureId.value = undefined

    hoverPopup.remove()
    hoveredFeature.value = null
  }

  /**
   * Attach popup listeners to a layer
   */
  function attachPopupListeners(layerId: string, layerLabel: string): void {
    if (!mapRef.value) return

    // First detach any existing listeners for this layer
    detachPopupListeners(layerId)

    // Create bound handler functions
    const clickHandler = (e: MapLayerMouseEvent) => handleLayerClick(layerId, layerLabel, e)
    const mouseMoveHandler = (e: MapLayerMouseEvent) => handleLayerMouseMove(layerId, layerLabel, e)
    const mouseLeaveHandler = () => handleLayerMouseLeave()

    // Store handlers for later removal
    attachedEventListeners[layerId] = {
      click: clickHandler,
      mousemove: mouseMoveHandler,
      mouseleave: mouseLeaveHandler
    }

    // Attach event listeners to the map
    mapRef.value.on('click', layerId, clickHandler)
    mapRef.value.on('mousemove', layerId, mouseMoveHandler)
    mapRef.value.on('mouseleave', layerId, mouseLeaveHandler)
  }

  /**
   * Detach popup listeners from a layer
   */
  function detachPopupListeners(layerId: string): void {
    if (!mapRef.value) return

    const listeners = attachedEventListeners[layerId]
    if (!listeners) return

    // Remove each listener type if it exists
    if (listeners.click) {
      mapRef.value.off('click', layerId, listeners.click)
    }

    if (listeners.mousemove) {
      mapRef.value.off('mousemove', layerId, listeners.mousemove)
    }

    if (listeners.mouseleave) {
      mapRef.value.off('mouseleave', layerId, listeners.mouseleave)
    }

    // Remove from tracking object
    delete attachedEventListeners[layerId]
  }

  /**
   * Detach all popup listeners
   */
  function detachAllPopupListeners(): void {
    if (!mapRef.value) return

    Object.keys(attachedEventListeners).forEach((layerId) => {
      detachPopupListeners(layerId)
    })
  }

  /**
   * Clean up resources
   */
  function cleanup(): void {
    detachAllPopupListeners()

    if (hoverPopup) {
      hoverPopup.remove()
    }

    hoveredFeature.value = null
    selectedFeatureId.value = undefined
    currentFeatureId.value = undefined
  }

  // Auto-cleanup when component unmounts
  onUnmounted(() => {
    cleanup()
  })

  // Return values and methods to be used by the component
  return {
    // State
    hoveredFeature,
    selectedFeatureId,

    // Methods
    attachPopupListeners,
    detachPopupListeners,
    detachAllPopupListeners,
    cleanup
  }
}
