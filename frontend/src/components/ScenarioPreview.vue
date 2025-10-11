<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Scenario } from '@/stores/scenarios'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps<{
  scenario: Scenario
}>()

const container = ref<HTMLDivElement | null>(null)

const sceneSize = { x: 200, y: 200 }

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let cubes: THREE.Mesh[] = []

// Create or update cubes
function createCubes() {
  // Clear existing
  cubes.forEach((cube) => scene.remove(cube))
  cubes = []

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0x4e9aef })

  for (const box of props.scenario.buildingHeights) {
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(box.x - sceneSize.x / 2, box.h / 2, box.y - sceneSize.y / 2) // sit on ground and center horizontally
    cube.scale.set(2, box.h, 2)
    scene.add(cube)
    cubes.push(cube)
  }
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xeeeeee)

  const aspect = container.value!.clientWidth / container.value!.clientHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(120, 120, 120)
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
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.4
  controls.maxDistance = 400

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 50, 20)
  scene.add(light)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)

  createCubes()

  // 🌀 Animation loop
  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 💡 Handle resize
  window.addEventListener('resize', onResize)
})

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
  cubes.forEach((cube) => cube.geometry.dispose())
})
</script>

<template>
  <div ref="container" class="three-container"></div>
</template>

<style scoped>
.three-container {
  width: 100%;
  height: 100vh;
  /* 👈 Ensures canvas is visible */
  display: block;
  margin: 0;
  padding: 0;
}
</style>
