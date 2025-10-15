<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScenariosStore, type BuildingPart, type Scenario } from '@/stores/scenarios'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createBuildingMaterial, createOscillatingPlaneMaterial, createSoilMaterial, simulationSoilTypeCodeToColor } from '@/lib/3d/materials';
import { createBuildingInstancedMesh, createSoilGeometry } from '@/lib/3d/scenarioPreviewBuilders';

const props = defineProps<{
  scenarioId: string
  plane: { rotationX: number; position: { x?: number; y?: number; z?: number } } | null
}>()

const scenarioStore = useScenariosStore();

const container = ref<HTMLDivElement | null>(null)

const sceneSize = { x: 200, y: 200 }; // in meters

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let scenario: Scenario | null = null;
let buildings: THREE.InstancedMesh | null = null;
let soil: THREE.Mesh | null = null;
let plane: THREE.Mesh | null = null;
let loading = ref(true);

watch(() => props.scenarioId, async (newId, oldId) => {
  if (newId === oldId) return;

  loading.value = true;

  scenario = await scenarioStore.getScenario(newId);

  createSoil();
  createBuildings();

  loading.value = false;
}, { immediate: true });

watch(() => props.plane, (newPlane, oldPlane) => {
  if (newPlane === oldPlane) return;

  createPlane();
}, { immediate: true });

function createPlane() {
  if (!props.plane) return;
  if (plane) scene.remove(plane);

  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = createOscillatingPlaneMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotateX(props.plane.rotationX);
  if (props.plane.position.x) mesh.position.x = props.plane.position.x;
  if (props.plane.position.y) mesh.position.y = props.plane.position.y;
  if (props.plane.position.z) mesh.position.z = props.plane.position.z;
  scene.add(mesh);

  plane = mesh;
}

function createSoil() {
  if (!scenario?.soil) return;
  if (soil) scene.remove(soil);

  const geometry = createSoilGeometry(sceneSize, 2, scenario.soil);

  const mesh = new THREE.Mesh(geometry, createSoilMaterial());
  mesh.rotateX(-Math.PI / 2);
  scene.add(mesh);

  soil = mesh;
}

// Create or update buildings
function createBuildings() {
  if (!scenario?.buildings) return;

  if (buildings) scene.remove(buildings);

  buildings = createBuildingInstancedMesh(scenario.buildings, sceneSize);
  scene.add(buildings);
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
  // controls.autoRotate = true
  controls.autoRotateSpeed = 0.4
  controls.maxDistance = 400

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 50, 20)
  scene.add(light)

  const ambient = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambient)

  // 🌀 Animation loop
  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  // 💡 Handle resize
  window.addEventListener('resize', onResize)
});

function onResize() {
  if (!container.value) return;

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  renderer.dispose();
  buildings?.geometry.dispose();
  soil?.geometry.dispose();
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
