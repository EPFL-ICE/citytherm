export interface SimulationPlane {
  rotationX: number // in radians
  position: { x?: number; y?: number; z?: number }
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

export type SimulationPlanePresetsMap = Record<SimulationPlanePreset, SimulationPlaneOption>

export function getSimulationPlanePresetsForParameters(
  buildingCanopyHeight: number,
  midBuildingZ: number
): SimulationPlanePresetsMap {
  return {
    horizontal_ground: {
      slug: 'horizontal_ground',
      name: 'Horizontal - Ground (0.2m)',
      description:
        'A horizontal plane at ground level (0.2m), useful for assessing surface temperatures.',
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 0.2, z: 0 } }
    },
    horizontal_human_height: {
      slug: 'horizontal_human_height',
      name: 'Horizontal - Human Height (1.4m)',
      description: 'A horizontal plane at 1.4 meters above ground, representing human height.',
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 1.4, z: 0 } }
    },
    horizontal_building_canopy: {
      slug: 'horizontal_building_canopy',
      name: `Horizontal - Building Canopy (${buildingCanopyHeight + 1}m)`,
      description: `A horizontal plane 1m above the average building height (${
        buildingCanopyHeight + 1
      }m).`,
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: buildingCanopyHeight + 1, z: 0 } }
    },
    vertical_mid_canyon: {
      slug: 'vertical_mid_canyon',
      name: 'Vertical - Mid Street Canyon',
      description: 'A vertical plane cutting through the middle of a street canyon.',
      plane: { rotationX: 0, position: { x: 0, y: 0, z: 0 } }
    },
    vertical_mid_building: {
      slug: 'vertical_mid_building',
      name: 'Vertical - Mid Building',
      description: `A vertical plane cutting through the middle of a building.`,
      plane: { rotationX: 0, position: { x: 0, y: 0, z: midBuildingZ } }
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
