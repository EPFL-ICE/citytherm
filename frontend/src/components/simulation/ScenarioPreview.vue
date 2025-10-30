<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  useScenariosStore,
  type BuildingPart,
  type ScenarioMap
} from '@/stores/simulation/scenarios'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createOscillatingPlaneMaterial, createSoilMaterial } from '@/lib/3d/materials'
import { createBuildingInstancedMesh, createSoilGeometry } from '@/lib/3d/scenarioPreviewBuilders'
import type { SimulationPlane } from '@/lib/simulation/simulationResultPlanesUtils'

const props = defineProps<{
  scenarioId: string
  plane: SimulationPlane | null
}>()

const scenarioStore = useScenariosStore()

const container = ref<HTMLDivElement | null>(null)

const sceneSize = { x: 200, y: 200 } // in meters

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let scenario: ScenarioMap | null = null
let buildings: THREE.InstancedMesh | null = null
let soil: THREE.Mesh | null = null
let plane: THREE.Mesh | null = null

const ready = ref(false)
let loading = ref(true)

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
  scene.scale.z = -1 // Invert Z axis to have a right-handed coordinate system (Positive Z goes into the scene rather than out of it)

  const aspect = container.value!.clientWidth / container.value!.clientHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(-80, 120, 180)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value!.clientWidth, container.value!.clientHeight)
  container.value!.appendChild(renderer.domElement)

  // 💫 OrbitControls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = true
  controls.minDistance = 5
  controls.autoRotateSpeed = 0.4
  controls.maxDistance = 400

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 50, 20)
  scene.add(light)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)

  createAxes()

  // 🌀 Animation loop
  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 💡 Handle resize
  window.addEventListener('resize', onResize)

  ready.value = true
})

watch(
  () => [props.scenarioId, ready.value],
  async (newId, oldId) => {
    if (!ready.value) return
    if (newId === oldId) return

    loading.value = true

    scenario = await scenarioStore.getScenarioMap(props.scenarioId)

    createSoil()
    createBuildings()

    loading.value = false
  },
  { immediate: true }
)

watch(
  () => [props.plane, ready.value],
  (newPlane, oldPlane) => {
    if (!ready.value) return
    if (newPlane === oldPlane) return

    createPlane()
  },
  { immediate: true }
)

function createPlane() {
  if (!props.plane) return
  if (plane) scene.remove(plane)

  const geometry = new THREE.PlaneGeometry(
    props.plane.size?.width || 200,
    props.plane.size?.height || 200
  )
  const material = createOscillatingPlaneMaterial()
  const mesh = new THREE.Mesh(geometry, material)

  if (props.plane.rotation.x) mesh.rotateX(props.plane.rotation.x)
  if (props.plane.rotation.y) mesh.rotateY(props.plane.rotation.y)
  if (props.plane.rotation.z) mesh.rotateZ(props.plane.rotation.z)

  if (props.plane.position.x) mesh.position.x = props.plane.position.x
  if (props.plane.position.y) mesh.position.y = props.plane.position.y
  if (props.plane.position.z) mesh.position.z = props.plane.position.z
  scene.add(mesh)

  plane = mesh
}

function createSoil() {
  if (!scenario?.soil) return
  if (soil) scene.remove(soil)

  const geometry = createSoilGeometry(sceneSize, 2, scenario.soil)

  const mesh = new THREE.Mesh(geometry, createSoilMaterial())
  mesh.rotateX(-Math.PI / 2)
  scene.add(mesh)

  soil = mesh
}

// Create or update buildings
function createBuildings() {
  if (!scenario?.buildings) return

  if (buildings) scene.remove(buildings)

  buildings = createBuildingInstancedMesh(scenario.buildings, sceneSize)
  scene.add(buildings)
}

function createArrow(arrowLength = 100, arrowWidth = 1, color = 0xff0000) {
  const arrow = new THREE.Group()

  const shaftGeometry = new THREE.CylinderGeometry(arrowWidth, arrowWidth, arrowLength, 8)
  const shaftMaterial = new THREE.MeshBasicMaterial({ color })
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
  arrow.add(shaft)

  const headGeometry = new THREE.CylinderGeometry(0, arrowWidth * 2, arrowWidth * 4, 8)
  const headMaterial = new THREE.MeshBasicMaterial({ color })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = arrowLength / 2 + arrowWidth * 2
  arrow.add(head)

  return arrow
}

function makeTextSprite(
  message: string,
  parameters: Partial<{ fontFace: string; fontSize: number; color: string }> = {}
) {
  const fontFace = parameters.fontFace || 'Arial'
  const fontSize = parameters.fontSize || 512
  const color = parameters.color || 'rgba(255, 255, 255, 1.0)'

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not get canvas context')

  context.font = `${fontSize}px ${fontFace}`
  const textWidth = context.measureText(message).width

  canvas.width = textWidth
  canvas.height = fontSize * 1.2 // some padding

  // Redraw with correct size
  context.font = `${fontSize}px ${fontFace}`
  context.fillStyle = color
  context.fillText(message, 0, fontSize)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)

  // scale sprite so text isn't huge
  sprite.scale.set(canvas.width / 100, canvas.height / 100, 1)

  return sprite
}

function createAxis(
  length: number,
  color: number,
  label: string,
  labelsColor: string,
  graduationStep = 20,
  graduationOffset: THREE.Vector3 = new THREE.Vector3(0, 0, -5)
) {
  const group = new THREE.Group()

  const arrowX = createArrow(length, 1, color)
  group.add(arrowX)

  const xLabel = makeTextSprite(label, { color: labelsColor })
  xLabel.position.set(0, length / 2 + 5, 0)
  group.add(xLabel)

  for (let i = graduationStep; i <= length; i += graduationStep) {
    const tick = makeTextSprite(`${i}m`, { fontSize: 256, color: labelsColor })
    tick.rotation.z = -Math.PI / 2
    tick.position.set(0, i - length / 2, 0).add(graduationOffset)
    group.add(tick)
  }

  return group
}

function createAxes() {
  const xAxis = createAxis(sceneSize.x, 0xff0000, 'X', 'red')
  xAxis.rotation.z = -Math.PI / 2
  xAxis.position.set(0, 0, -sceneSize.y / 2)
  scene.add(xAxis)

  const yAxis = createAxis(sceneSize.y, 0x0000ff, 'Y', 'blue', 20, new THREE.Vector3(-5, 0, 0))
  yAxis.rotation.x = Math.PI / 2
  yAxis.position.set(-sceneSize.x / 2, 0, 0)
  scene.add(yAxis)

  const zHeight = 70
  const zAxis = createAxis(zHeight, 0x00ff00, 'Z', 'green', 10, new THREE.Vector3(-5, 0, -5))
  zAxis.position.set(-sceneSize.x / 2, zHeight / 2, -sceneSize.y / 2)
  scene.add(zAxis)
}

function onResize() {
  if (!container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  renderer.dispose()
  buildings?.geometry.dispose()
  soil?.geometry.dispose()
})
</script>

<template>
  <div ref="container" class="three-container"></div>

  <v-overlay :model-value="loading" contained class="align-center justify-center">
    <v-progress-circular color="primary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<style scoped>
.three-container {
  min-width: 0;
  max-width: 100%;
  height: 100%;
  display: block;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
