import type { SluggedSimulationResultVariable } from '@/stores/simulation/simulationResultVariables'

export interface SimulationVariableGroup {
  groupName: string
  variables: SluggedSimulationResultVariable[]
}

export interface GroupSimulationOptions {
  availableAt?: number
  renameWallAndFacadeToRoof?: boolean
  putPETandUTCIinCommonGroup?: boolean
}

export function groupSimulationVariablesByAvailableAt(
  variables: SluggedSimulationResultVariable[],
  options: GroupSimulationOptions
): SimulationVariableGroup[] {
  const commonVariables = variables.filter((variable) => !variable.available_at)

  if (options.availableAt) {
    const heightVariables = variables.filter((variable) =>
      variable.available_at?.includes(options.availableAt!)
    )

    // I want to puke here but it's not my fault if they want this special case
    if (options.putPETandUTCIinCommonGroup) {
      const petAndUtciVariables = heightVariables.filter(
        (variable) => variable.slug === 'PET' || variable.slug === 'UTCI'
      )
      commonVariables.push(...petAndUtciVariables)
      // Remove PET and UTCI from heightVariables
      for (const variable of petAndUtciVariables) {
        const index = heightVariables.indexOf(variable)
        if (index > -1) {
          heightVariables.splice(index, 1)
        }
      }
    }

    return [
      {
        groupName: 'Parameter',
        variables: commonVariables
      },
      {
        groupName: `${heightToText(options.availableAt!)} (${options.availableAt!.toFixed(1)} m)`,
        variables: options.renameWallAndFacadeToRoof
          ? heightVariables.map((variable) => ({
              ...variable,
              long_name: variable.long_name.replace('Wall', 'Roof').replace('Facade', 'Roof')
            }))
          : heightVariables
      }
    ]
  }

  return [
    {
      groupName: 'Parameter',
      variables: commonVariables
    }
  ]
}

export function heightToText(height: number): string {
  if (height <= 0.2) {
    return 'Surface data'
  }
  return `Building data`
}
