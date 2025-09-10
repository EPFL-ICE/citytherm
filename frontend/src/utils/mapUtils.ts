import { Map } from 'maplibre-gl'
import { computeBBoxFromFeatureCollection } from './boundingBoxUtils'

/**
 * Adjust map zoom to fit the grid to the container height
 * @param map MapLibre map instance
 * @param gridData GeoJSON FeatureCollection containing grid data
 * @param padding Padding in pixels (default: 20)
 */
export function fitGridToContainerHeight(map: Map, gridData: any, padding: number = 20): void {
  try {
    // Calculate bounding box of the grid
    const bbox = computeBBoxFromFeatureCollection(gridData)

    // Get map container dimensions
    const container = map.getContainer()
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calculate the bounding box dimensions
    const bboxWidth = bbox[2] - bbox[0]
    const bboxHeight = bbox[3] - bbox[1]

    // Calculate scale factors to fit width and height
    const scaleX = (containerWidth - padding * 2) / bboxWidth
    const scaleY = (containerHeight - padding * 2) / bboxHeight

    // Use the smaller scale to ensure the entire grid fits within the container
    // This prioritizes fitting the height (as per the requirement)
    const scale = Math.min(scaleX, scaleY)

    // Calculate zoom level based on scale
    // Zoom level calculation based on Mapbox/MapLibre documentation
    const zoom = Math.log2((scale * 512) / 256) // 512 is the tile size

    // Calculate center of the bounding box
    const center: [number, number] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

    // Set the map view
    map.setCenter(center)
    map.setZoom(zoom)
  } catch (error) {
    console.error('Error fitting grid to container height:', error)
  }
}

/**
 * Alternative implementation that specifically fits to height
 * @param map MapLibre map instance
 * @param gridData GeoJSON FeatureCollection containing grid data
 * @param padding Padding in pixels (default: 20)
 */
export function fitGridHeightToContainer(map: Map, gridData: any, padding: number = 20): void {
  try {
    // Calculate bounding box of the grid
    const bbox = computeBBoxFromFeatureCollection(gridData)

    // Get map container dimensions
    const container = map.getContainer()
    const containerHeight = container.clientHeight

    // Calculate the bounding box height
    const bboxHeight = bbox[3] - bbox[1]

    // Calculate scale factor to fit height
    const scale = (containerHeight - padding * 2) / bboxHeight

    // Calculate zoom level based on scale
    const zoom = Math.log2((scale * 512) / 256) // 512 is the tile size

    // Calculate center of the bounding box
    const center: [number, number] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

    // Set the map view
    map.setCenter(center)
    map.setZoom(zoom)
  } catch (error) {
    console.error('Error fitting grid height to container:', error)
  }
}
