import type { SluggedSimulationResultVariable } from '@/stores/simulation/simulationResultVariables'

export interface SimulationVariableGroup {
  groupName: string
  categories: CategorizedSimulationVariableSubgroup[]
}

export interface CategorizedSimulationVariableSubgroup {
  categorySlug?: string
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
    // Dirty special case for PET and UTCI
    if (options.putPETandUTCIinCommonGroup) {
      const petAndUtciVariables = variables.filter(
        (variable) => variable.slug === 'PET' || variable.slug === 'UTCI'
      )
      commonVariables.push(...petAndUtciVariables)
    }
    const heightVariables = variables.filter(
      (variable) =>
        variable.available_at?.includes(options.availableAt!) &&
        (options.putPETandUTCIinCommonGroup ? !['PET', 'UTCI'].includes(variable.slug) : true)
    )

    const renamed = options.renameWallAndFacadeToRoof
      ? heightVariables.map((variable) => ({
          ...variable,
          long_name: variable.long_name.replace('Wall', 'Roof').replace('Facade', 'Roof')
        }))
      : heightVariables

    return [
      {
        groupName: 'Parameter',
        categories: divideGroupIntoCategories(commonVariables)
      },
      {
        groupName: `${heightToText(options.availableAt!)} (${options.availableAt!.toFixed(1)} m)`,
        categories: divideGroupIntoCategories(renamed)
      }
    ]
  }

  return [
    {
      groupName: 'Parameter',
      categories: divideGroupIntoCategories(commonVariables)
    }
  ]
}

export function heightToText(height: number): string {
  if (height <= 0.2) {
    return 'Surface data'
  }
  return `Building data`
}

export function divideGroupIntoCategories(
  variables: SluggedSimulationResultVariable[]
): CategorizedSimulationVariableSubgroup[] {
  console.log('Dividing group into categories', variables)
  const categorizedVariablesMap = new Map<
    string | undefined,
    CategorizedSimulationVariableSubgroup
  >()

  variables.forEach((variable) => {
    if (!categorizedVariablesMap.get(variable.category_slug)) {
      categorizedVariablesMap.set(variable.category_slug, {
        categorySlug: variable.category_slug,
        variables: []
      })
    }
    categorizedVariablesMap.get(variable.category_slug)!.variables.push(variable)
  })

  return Array.from(categorizedVariablesMap.values())
}

export function getAllVariablesInCategory(
  categorySlug: string | undefined,
  variablesList: SluggedSimulationResultVariable[]
): SluggedSimulationResultVariable[] {
  return variablesList.filter((variable) => variable.category_slug === categorySlug)
}
