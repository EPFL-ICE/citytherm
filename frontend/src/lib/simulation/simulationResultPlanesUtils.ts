export interface SimulationPlane {
  rotation: { x?: number; y?: number; z?: number } // in radians
  position: { x?: number; y?: number; z?: number }
  size?: { width?: number; height?: number }
}

export interface SimulationPlaneOption {
  slug: string
  name: string
  description: string
  plane: SimulationPlane
}

export type SimulationPlanePreset =
  | 'horizontal_ground'
  | 'horizontal_human_height'
  | 'horizontal_building_canopy'
  | 'vertical_mid_canyon'
  | 'vertical_mid_building'
  | 'horizontal_underground'
  | 'horizontal_underground_deep'
  | 'vertical_mid_canyon_underground'
  | 'vertical_mid_building_underground'

export type SimulationPlanePresetsMap = Record<SimulationPlanePreset, SimulationPlaneOption>

export function getSimulationPresetsForScenarioSlug(
  scenarioSlug: string = 'S0'
): SimulationPlanePresetsMap {
  const buildingCanopyHeight = scenarioSlug.includes('S1_1') ? 30 : 16
  const midBuildingZ = scenarioSlug.includes('S1_2') ? 25 : 19

  return getSimulationPlanePresetsForParameters(buildingCanopyHeight, midBuildingZ)
}

export function getSimulationPlanePresetsForParameters(
  buildingCanopyHeight: number,
  midBuildingX: number
): SimulationPlanePresetsMap {
  return {
    horizontal_underground: {
      slug: 'horizontal_underground',
      name: `Horizontal - Underground (-0.2m)`,
      description: `A horizontal plane below ground level.`,
      plane: {
        rotation: { x: -Math.PI / 2 },
        position: { x: 0, y: -0.2 * 5, z: 0 },
        size: { width: 205, height: 205 }
      }
    },
    horizontal_underground_deep: {
      slug: 'horizontal_underground_deep',
      name: `Horizontal - Underground Deep (-1m)`,
      description: `A horizontal plane deep below ground level.`,
      plane: {
        rotation: { x: -Math.PI / 2 },
        position: { x: 0, y: -1 * 5, z: 0 },
        size: { width: 205, height: 205 }
      }
    },
    horizontal_ground: {
      slug: 'horizontal_ground',
      name: 'Horizontal - Ground',
      description: 'A horizontal plane at ground level, useful for assessing surface temperatures.',
      plane: { rotation: { x: -Math.PI / 2 }, position: { x: 0, y: 0.2, z: 0 } }
    },
    horizontal_human_height: {
      slug: 'horizontal_human_height',
      name: `Horizontal - Human Height (1.4m)`,
      description: 'A horizontal plane at 1.4m above ground, representing human height.',
      plane: { rotation: { x: -Math.PI / 2 }, position: { x: 0, y: 1.4, z: 0 } }
    },
    horizontal_building_canopy: {
      slug: 'horizontal_building_canopy',
      name: `Horizontal - Building Canopy (${buildingCanopyHeight + 1} m)`,
      description: `A horizontal plane at the top of the buildings.`,
      plane: {
        rotation: { x: -Math.PI / 2 },
        position: { x: 0, y: buildingCanopyHeight + 1, z: 0 }
      }
    },
    vertical_mid_canyon_underground: {
      slug: 'vertical_mid_canyon_underground',
      name: `Vertical - Mid Street Canyon Underground`,
      description: `A vertical plane cutting through the middle of a street canyon, below ground level.`,
      plane: {
        rotation: { y: Math.PI / 2 },
        position: { x: 0, y: -5, z: 0 },
        size: { width: 205, height: 10 }
      }
    },
    vertical_mid_building_underground: {
      slug: 'vertical_mid_building_underground',
      name: `Vertical - Mid Building Underground`,
      description: `A vertical plane cutting through the middle of a building, below ground level.`,
      plane: {
        rotation: { y: Math.PI / 2 },
        position: { x: midBuildingX, y: -5, z: 0 },
        size: { width: 205, height: 10 }
      }
    },
    vertical_mid_canyon: {
      slug: 'vertical_mid_canyon',
      name: 'Vertical - Mid Street Canyon',
      description: 'A vertical plane cutting through the middle of a street canyon.',
      plane: { rotation: { y: Math.PI / 2 }, position: { x: 0, y: 35, z: 0 }, size: { height: 70 } }
    },
    vertical_mid_building: {
      slug: 'vertical_mid_building',
      name: 'Vertical - Mid Building',
      description: `A vertical plane cutting through the middle of a building.`,
      plane: {
        rotation: { y: Math.PI / 2 },
        position: { x: midBuildingX, y: 35, z: 0 },
        size: { height: 70 }
      }
    }
  }
}

export interface SimulationPlaneAvailableTimeSlot {
  label: string
  timeSlug: string
}

export function getSimulationPlaneAvailableTimeSlots() {
  return [
    { label: '00:00', timeSlug: 'time_0' },
    { label: '04:00', timeSlug: 'time_4' },
    { label: '08:00', timeSlug: 'time_8' },
    { label: '12:00', timeSlug: 'time_12' },
    { label: '16:00', timeSlug: 'time_16' },
    { label: '20:00', timeSlug: 'time_20' }
  ]
}

export function getPlaneAvailableHeightLevels(plane: SimulationPlanePreset): number[] {
  const humanHeight = 1.4000000953674316
  const dict = {
    horizontal_ground: [0.2],
    horizontal_human_height: [humanHeight],
    horizontal_building_canopy: [17, 31],
    vertical_mid_canyon: [0.2, humanHeight, 17, 31],
    vertical_mid_building: [0.2, humanHeight, 17, 31],
    horizontal_underground: [-0.25],
    horizontal_underground_deep: [-1.25],
    vertical_mid_canyon_underground: [-0.25, -1.25],
    vertical_mid_building_underground: [-0.25, -1.25]
  }
  return dict[plane as keyof typeof dict]
}

export function variableForPlaneOrFallback(
  plane: SimulationPlanePreset,
  variableSlug?: string
): string {
  const height = getPlaneAvailableHeightLevels(plane)
  if (!height.some((h) => h > 0)) {
    return 'SoilTemp'
  }
  if (variableSlug === 'SoilTemp') {
    return 'T'
  }
  return variableSlug ?? 'T'
}
