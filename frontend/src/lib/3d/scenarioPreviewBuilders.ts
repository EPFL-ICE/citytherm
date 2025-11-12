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
      correspondingAnomaly ? correspondingAnomaly : soilMap.defaultSoilType
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

interface ObjectGroup {
  group: THREE.Group
  updateCallbacks: Array<() => void>
}

export function createObjectsGroup(
  objectsMap: SimulationObjectMap,
  sceneSize: Vector2
): ObjectGroup {
  const group = new THREE.Group()
  const callbacks: Array<() => void> = []

  // Create objects based on the scenario data
  objectsMap.objects.forEach((object, i) => {
    if (object.o ?? objectsMap.defaultObject === 11) {
      return // skip grass to avoid creating too many meshes
    }
    const objGroup = createObjectGroup(object, objectsMap.defaultObject)
    callbacks.push(...objGroup.updateCallbacks)
    objGroup.group.position.set(object.x, 0, object.y) // assuming y is up
    group.add(objGroup.group)
  })

  return { group, updateCallbacks: callbacks }
}

function createObjectGroup(object: SimulationObject, defaultType: number): ObjectGroup {
  const o = object.o ?? defaultType

  if (o === -2) {
    return createTreeMesh(6, 7, 0xeeeeee, 0x55aa55) // Betula Tree, hardcoded values provided by Jaafar
  } else if (o === -3) {
    return createTreeMesh(11, 9) // Acer Tree, hardcoded values provided by Jaafar
  } else if (o === -10) {
    return createMistNozzleGroup() // Mist Nozzle
  } else if (o === -11) {
    return createFountainGroup() // Fountain
  } else if (o === 11) {
    // return createVegetationCubeMesh(0.1, 2, 0x44cc5a) // grass
  } else if (o === 13) {
    return createVegetationCubeMesh(1, 2) // Hedge
  }

  // Default: simple cone as placeholder

  const group = new THREE.Group()
  const geometry = new THREE.ConeGeometry(1, 2, 8)
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  const mesh = new THREE.Mesh(geometry, material)
  group.add(mesh)

  return { group, updateCallbacks: [] }
}

function createVegetationCubeMesh(height: number, width: number, color = 0x228b22): ObjectGroup {
  const group = new THREE.Group()

  // Create hedge geometry
  const geometry = new THREE.BoxGeometry(width, height, width)
  const material = new THREE.MeshStandardMaterial({ color })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, height / 2, 0)
  group.add(mesh)

  return { group, updateCallbacks: [] }
}

function createTreeMesh(
  height: number,
  crownWidth: number,
  trunkColor = 0x8b4513,
  crownColor = 0x228b22
): ObjectGroup {
  const group = new THREE.Group()

  // Create trunk
  const trunkHeight = height * 0.8
  const trunkRadius = crownWidth * 0.1
  const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8)
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: trunkColor })
  const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunkMesh.position.y = trunkHeight / 2 // position trunk at the bottom
  group.add(trunkMesh)

  // Create crown
  const crownRadius = crownWidth * 0.5
  const geometry = new THREE.IcosahedronGeometry(crownRadius, 1)
  const material = new THREE.MeshStandardMaterial({ color: crownColor })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = height - crownRadius / 2 // position crown at the top
  group.add(mesh)

  return { group, updateCallbacks: [] }
}

function createMistNozzleGroup(): ObjectGroup {
  const group = new THREE.Group()

  const nozzleHeight = 3
  const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8)
  const material = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = nozzleHeight
  group.add(mesh)

  const particleCount = 150
  const vertices = []
  const velocities = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const x = 0
    const y = Math.random() * nozzleHeight
    const z = 0
    vertices.push(x, y, z)

    initVelocity(i)
  }

  function initVelocity(index: number) {
    const dir = new THREE.Vector3(Math.random() - 0.5, -0.1, Math.random() - 0.5).normalize()
    velocities[index * 3] = dir.x
    velocities[index * 3 + 1] = dir.y
    velocities[index * 3 + 2] = dir.z
  }

  const dropletsGeometry = new THREE.BufferGeometry()
  dropletsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const dropletsMaterial = new THREE.PointsMaterial({ color: 0x55aaff })
  const points = new THREE.Points(dropletsGeometry, dropletsMaterial)
  points.material.size = 0.1
  points.material.sizeAttenuation = true
  group.add(points)

  function updateWaterDroplets() {
    const speedScale = 0.025
    const dampenLateral = 0.98
    const gravity = -0.01
    const pos = dropletsGeometry.attributes.position.array

    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += velocities[i] * speedScale
      pos[i + 1] += velocities[i + 1] * speedScale
      pos[i + 2] += velocities[i + 2] * speedScale

      // Apply gravity
      velocities[i + 1] += gravity
      // Dampen lateral movement
      velocities[i] *= dampenLateral
      velocities[i + 2] *= dampenLateral

      if (pos[i + 1] < 0) {
        // Reset droplet above nozzle
        pos[i] = 0
        pos[i + 1] = nozzleHeight
        pos[i + 2] = 0

        initVelocity(i / 3)
      }
    }
    dropletsGeometry.attributes.position.needsUpdate = true
  }

  return { group, updateCallbacks: [updateWaterDroplets] }
}

function createFountainGroup(): ObjectGroup {
  const group = new THREE.Group()

  const nozzleHeight = 0.25
  const baseGeometry = new THREE.TorusGeometry(0.5, nozzleHeight, 16, 100)
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb })
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
  baseMesh.rotation.x = Math.PI / 2
  group.add(baseMesh)

  const waterGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16)
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.6
  })
  const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial)
  waterMesh.position.y = 0.15
  group.add(waterMesh)

  const particleCount = 350
  const vertices = []
  const velocities = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const x = 0
    const y = Math.random() * 4
    const z = 0
    vertices.push(x, y, z)

    initVelocity(i, 0)
    velocities[i * 3 + 1] = Math.random() - 0.5 // give some extra vertical boost
  }

  function initVelocity(index: number, verticalFactor = 1.0) {
    const dir = new THREE.Vector3(
      Math.random() - 0.5,
      0.6 + Math.random() * 0.4,
      Math.random() - 0.5
    ).normalize()
    velocities[index * 3] = dir.x
    velocities[index * 3 + 1] = dir.y * 1.6 * verticalFactor
    velocities[index * 3 + 2] = dir.z
  }

  const dropletsGeometry = new THREE.BufferGeometry()
  dropletsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const dropletsMaterial = new THREE.PointsMaterial({ color: 0x55aaff })
  const points = new THREE.Points(dropletsGeometry, dropletsMaterial)
  points.material.size = 0.05
  points.material.sizeAttenuation = true
  group.add(points)

  function updateWaterDroplets() {
    const speedScale = 0.025
    const dampenLateral = 0.95
    const gravity = -0.01
    const pos = dropletsGeometry.attributes.position.array

    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += velocities[i] * speedScale
      pos[i + 1] += velocities[i + 1] * speedScale
      pos[i + 2] += velocities[i + 2] * speedScale

      // Apply gravity
      velocities[i + 1] += gravity
      // Dampen lateral movement
      velocities[i] *= dampenLateral
      velocities[i + 2] *= dampenLateral

      if (pos[i + 1] < 0) {
        // Reset droplet above nozzle
        pos[i] = (Math.random() - 0.5) * 0.2
        pos[i + 1] = nozzleHeight
        pos[i + 2] = (Math.random() - 0.5) * 0.2

        initVelocity(i / 3)
      }
    }
    dropletsGeometry.attributes.position.needsUpdate = true
  }

  return { group, updateCallbacks: [updateWaterDroplets] }
}

function disposeMesh(mesh: THREE.Mesh | THREE.Points | THREE.Line) {
  if (mesh.geometry) {
    mesh.geometry.dispose()
  }

  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose())
    } else {
      mesh.material.dispose()
    }
  }
}

export function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Points ||
      child instanceof THREE.Line
    ) {
      disposeMesh(child)
    } else if (child instanceof THREE.Group) {
      child.children.forEach((groupChild) => {
        disposeObject3D(groupChild)
      })
    }
  })

  if (
    object instanceof THREE.Mesh ||
    object instanceof THREE.Points ||
    object instanceof THREE.Line
  ) {
    disposeMesh(object)
  }
}
