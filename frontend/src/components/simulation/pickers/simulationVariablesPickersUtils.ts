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
  availableAt?: number[]
  omitGroups?: string[]
  omitCategories?: string[]
  renameWallAndFacadeToRoof?: boolean
  putPETandUTCIinCommonGroup?: boolean
}

function hasOverlap(arr1: number[] | undefined, arr2: number[] | undefined): boolean {
  if (!arr1 || !arr2) return false
  return arr1.some((item) => arr2.includes(item))
}

export function groupSimulationVariablesByAvailableAt(
  variables: SluggedSimulationResultVariable[],
  options: GroupSimulationOptions
): SimulationVariableGroup[] {
  const grouped = new Map<string, SluggedSimulationResultVariable[]>()
  const groupsToOmit = options.omitGroups ?? []
  const filtered = options.availableAt
    ? variables.filter((variable) => hasOverlap(variable.available_at, options.availableAt))
    : variables
  for (const variable of filtered) {
    const key = variable.group ?? 'parameters'
    if (!groupsToOmit.includes(key)) {
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(variable)
    }
  }

  const categoriesToOmit = options.omitCategories ?? []

  return Array.from(grouped.entries()).map(([groupSlug, vars]) => ({
    groupName: groupSlugToDisplayName(groupSlug),
    categories: divideGroupIntoCategories(vars).filter(
      (category) => !categoriesToOmit.includes(category.categorySlug ?? '')
    )
  }))
}

function groupSlugToDisplayName(slug: string): string {
  const dict = {
    parameters: 'Parameters',
    surface_level: 'Ground Data',
    building_data: 'Building Data',
    underground_level: 'Underground Level',
    thermal_comfort_indices: 'Thermal Comfort Indices'
  }
  return (
    dict[slug as keyof typeof dict] ||
    slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('_', ' ')
  )
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
