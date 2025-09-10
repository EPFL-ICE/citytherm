function extractCoords(geom: any, coords: [number, number][]) {
  if (geom.type === 'Point') {
    coords.push(geom.coordinates)
  } else if (geom.type === 'LineString' || geom.type === 'MultiPoint') {
    coords.push(...geom.coordinates)
  } else if (geom.type === 'Polygon' || geom.type === 'MultiLineString') {
    geom.coordinates.forEach((ring: [number, number][]) => coords.push(...ring))
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach((poly: [number, number][][]) =>
      poly.forEach((ring) => coords.push(...ring))
    )
  } else if (geom.type === 'GeometryCollection') {
    geom.geometries.forEach(extractCoords)
  }
}

/**
 * Compute bounding box from a GeoJSON FeatureCollection
 * @param featureCollection GeoJSON FeatureCollection object
 * @returns Bounding box as [minX, minY, maxX, maxY]
 */
export function computeBBoxFromFeatureCollection(
  featureCollection: any
): [number, number, number, number] {
  if (
    !featureCollection ||
    featureCollection.type !== 'FeatureCollection' ||
    !featureCollection.features
  ) {
    throw new Error('Invalid FeatureCollection')
  }

  const allCoords: [number, number][] = []

  featureCollection.features.forEach((feature: any) => {
    if (feature.geometry) {
      const coords: [number, number][] = []

      extractCoords(feature.geometry, coords)
      allCoords.push(...coords)
    }
  })

  if (allCoords.length === 0) {
    throw new Error('No coordinates found in FeatureCollection')
  }

  const xs = allCoords.map((c) => c[0])
  const ys = allCoords.map((c) => c[1])

  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}
