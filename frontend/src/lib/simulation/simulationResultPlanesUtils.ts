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
  | 'Horizontal_Ground'
  | 'Horizontal_HumanHeight'
  | 'Horizontal_BuildingCanopy'
  | 'Vertical_MidCanyon'
  | 'Vertical_MidBuilding'

export type SimulationPlanePresetsMap = Record<SimulationPlanePreset, SimulationPlaneOption>;

export function getSimulationPlanePresetsForParameters(buildingCanopyHeight: number, midBuildingZ: number): SimulationPlanePresetsMap {
  return {
    Horizontal_Ground: {
      slug: 'Horizontal_Ground',
      name: 'Horizontal - Ground',
      description:
        'A horizontal plane at ground level (0.2m), useful for assessing surface temperatures.',
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 0.2, z: 0 } }
    },
    Horizontal_HumanHeight: {
      slug: 'Horizontal_HumanHeight',
      name: 'Horizontal - Human Height',
      description:
        'A horizontal plane at approximately 1.4 meters above ground, representing human height.',
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: 1.4, z: 0 } }
    },
    Horizontal_BuildingCanopy: {
      slug: 'Horizontal_BuildingCanopy',
      name: 'Horizontal - Building Canopy',
      description: `A horizontal plane one meter above the average building height (${buildingCanopyHeight + 1}m).`,
      plane: { rotationX: -Math.PI / 2, position: { x: 0, y: buildingCanopyHeight + 1, z: 0 } }
    },
    Vertical_MidCanyon: {
      slug: 'Vertical_MidCanyon',
      name: 'Vertical - Mid Street Canyon',
      description: 'A vertical plane cutting through the middle of a street canyon.',
      plane: { rotationX: 0, position: { x: 0, y: 0, z: 0 } }
    },
    Vertical_MidBuilding: {
      slug: 'Vertical_MidBuilding',
      name: 'Vertical - Mid Building',
      description: `A vertical plane cutting through the middle of a building (${midBuildingZ}m from center).`,
      plane: { rotationX: 0, position: { x: 0, y: 0, z: midBuildingZ } }
    }
  }
}