import type {
  BuildingMap,
  BuildingPart,
  SimulationObject,
  SimulationObjectMap,
  SoilMap
} from '@/stores/simulation/scenarios'
import * as THREE from 'three'
import { createBuildingMaterial, simulationSoilTypeCodeToColor } from './materials'

export interface Vector2 {
  x: number
  y: number
}

export function createSoilGeometry(sceneSize: Vector2, quadSize: number, soilMap: SoilMap) {
  const segX = sceneSize.x / quadSize
  const segY = sceneSize.y / quadSize
  const geometry = new THREE.PlaneGeometry(sceneSize.x, sceneSize.y, segX, segY).toNonIndexed() // toNonIndexed important for per-vertex color
  const colors = []
  const uvs = geometry.attributes.uv

  for (let i = 0; i < uvs.count; i += 6) {
    // 6 vertices per quad (two triangles)
    const quadIndex = i / 6
    // TODO check if axis are flipped
    const quadPosX = quadIndex % segX
    const quadPosY = Math.floor(quadIndex / segX) // segX is intentional !
    const dataX = quadPosX * 2 + 1
    const dataY = quadPosY * 2 + 1

    const correspondingAnomaly = soilMap.anomalies[`${dataX};${dataY}`]

    const color = simulationSoilTypeCodeToColor(
      correspondingAnomaly ? correspondingAnomaly.t : soilMap.defaultSoilType
    )

    // Push the same color for all 6 vertices of this quad
    for (let vIndex = 0; vIndex < 6; vIndex++) {
      colors.push(color.r, color.g, color.b)
    }
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function getTransformationMatrixForBuilding(
  sceneSize: Vector2,
  building: BuildingPart,
  defaultHeight: number,
  dummyObject?: THREE.Object3D
) {
  const h = building.h ?? defaultHeight
  const dummy = dummyObject || new THREE.Object3D()

  dummy.position.set(building.x - sceneSize.x / 2, h / 2, building.y - sceneSize.y / 2) // sit on ground and center horizontally
  dummy.scale.set(1, h, 1)
  dummy.updateMatrix()

  return dummy.matrix
}

function stringHexCodeToHexNumber(hex: string): number {
  return parseInt(hex.replace('#', '0x'), 16)
}

export function createBuildingInstancedMesh(buildingMap: BuildingMap, sceneSize: Vector2) {
  const geometry = new THREE.BoxGeometry(2, 1, 2)
  const material = createBuildingMaterial()

  // Prepare an InstancedMesh
  const count = buildingMap.buildingsParts.length
  const mesh = new THREE.InstancedMesh(geometry, material, count)

  // Create per‑instance attribute buffers
  const instanceTopColors = new Float32Array(count * 3)
  const instanceSideColors = new Float32Array(count * 3)
  const instanceWindowColors = new Float32Array(count * 3)

  const dummy = new THREE.Object3D()

  const defaultSideColor = stringHexCodeToHexNumber(buildingMap.defaultSideColor ?? '#bbbbbb')
  const defaultTopColor = stringHexCodeToHexNumber(buildingMap.defaultTopColor ?? '#bbbbbb')
  const defaultWindowColor = stringHexCodeToHexNumber('#8ad7dc')

  buildingMap.buildingsParts.forEach((building, i) => {
    // Set transformation matrix
    const matrix = getTransformationMatrixForBuilding(
      sceneSize,
      building,
      buildingMap.defaultHeight,
      dummy
    )
    mesh.setMatrixAt(i, matrix)

    // Set colors based on height
    const colorTop = new THREE.Color().setHex(
      building.tc ? stringHexCodeToHexNumber(building.tc) : defaultTopColor
    )
    const colorSide = new THREE.Color().setHex(
      building.sc ? stringHexCodeToHexNumber(building.sc) : defaultSideColor
    )
    const colorWindow = new THREE.Color().setHex(defaultWindowColor)

    // Stores the colors in the buffers
    colorTop.toArray(instanceTopColors, i * 3)
    colorSide.toArray(instanceSideColors, i * 3)
    colorWindow.toArray(instanceWindowColors, i * 3)
  })

  geometry.setAttribute(
    'instanceTopColor',
    new THREE.InstancedBufferAttribute(instanceTopColors, 3)
  )
  geometry.setAttribute(
    'instanceSideColor',
    new THREE.InstancedBufferAttribute(instanceSideColors, 3)
  )
  geometry.setAttribute(
    'instanceWindowColor',
    new THREE.InstancedBufferAttribute(instanceWindowColors, 3)
  )

  mesh.instanceMatrix.needsUpdate = true

  return mesh
}

export function createObjectsGroup(objectsMap: SimulationObjectMap, sceneSize: Vector2) {
  const group = new THREE.Group()

  // Create objects based on the scenario data
  objectsMap.objects.forEach((object) => {
    const mesh = createObjectMesh(object)
    group.add(mesh)
  })

  return group
}

function createObjectMesh(object: SimulationObject) {
  // For simplicity, represent all objects as simple cones
  const geometry = new THREE.ConeGeometry(1, 2, 8)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.set(object.x, 1, object.y) // assuming y is up

  return mesh
}
