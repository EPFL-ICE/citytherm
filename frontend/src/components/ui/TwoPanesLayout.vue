<script setup lang="ts">
import {
  makePathToPlaneComparator,
  makePathToPlaneExplorer,
  makePathToPlaneSingleExplorer,
  makePathToTimeSeriesComparator,
  makePathToTimeSeriesDepthExplorer,
  makePathToTimeSeriesExplorer,
  makePathToTimeSeriesSingleExplorer
} from '@/lib/utils/routingUtils'
import { computed, ref, type Component } from 'vue'
import { useRoute } from 'vue-router'
import {
  mdiChevronRight,
  mdiRectangle,
  mdiChartLine,
  mdiSelectCompare,
  mdiCompass,
  mdiDice1,
  mdiArrowDownBold
} from '@mdi/js'

const props = defineProps<{
  title: string
  disableLeftPanePadding?: boolean
}>()

const route = useRoute()

function getSubItems(where: 'plane' | 'timeSeries'): MenuItem[] {
  const scenarios =
    (route.query.scenarios as string | undefined)?.split(',') ??
    (route.params.scenario
      ? [route.params.scenario as string]
      : [route.params.scenarioA as string, route.params.scenarioB as string])
  const variables = (route.query.variables as string | undefined)?.split(',') ||
    (route.query.vars as string | undefined)?.split(',') || [route.params.variable as string]

  if (where === 'plane') {
    const plane = (route.params.plane as string) ?? 'horizontal_ground'
    const time = (route.params.time as string) ?? 'time_12'

    return [
      {
        title: 'Explorer',
        icon: mdiCompass,
        type: 'link',
        href: makePathToPlaneExplorer({ plane, time, variable: variables[0] ?? 'T', scenarios }),
        disabled: false
      },
      {
        title: 'Comparator',
        icon: mdiSelectCompare,
        type: 'link',
        href: makePathToPlaneComparator({
          plane,
          time,
          scenarioA: scenarios[0] ?? 'S0',
          scenarioB: scenarios[1] ?? 'S1_1',
          variables
        }),
        disabled: false
      },
      {
        title: 'Single',
        icon: mdiDice1,
        type: 'link',
        href: makePathToPlaneSingleExplorer({
          plane,
          time,
          scenario: scenarios[0] ?? 'S0',
          variables
        }),
        disabled: false
      }
    ]
  }

  const point = (route.params.point as string) ?? 'urban_canyon_windward_ground'
  return [
    {
      title: 'Explorer',
      icon: mdiCompass,
      type: 'link',
      href: makePathToTimeSeriesExplorer({ point, scenarios, variables }),
      disabled: false
    },
    {
      title: 'Comparator',
      icon: mdiSelectCompare,
      type: 'link',
      href: makePathToTimeSeriesComparator({
        point,
        scenarioA: scenarios[0] ?? 'S0',
        scenarioB: scenarios[1] ?? 'S1_1',
        variables
      }),
      disabled: false
    },
    {
      title: 'Single',
      icon: mdiDice1,
      type: 'link',
      href: makePathToTimeSeriesSingleExplorer({
        point,
        scenario: scenarios[0] ?? 'S0',
        categories: []
      }),
      disabled: false
    },
    {
      title: 'Depth',
      icon: mdiArrowDownBold,
      type: 'link',
      href: makePathToTimeSeriesDepthExplorer({ point, scenario: scenarios[0] ?? 'S0', variables }),
      disabled: false
    }
  ]
}

const breadcrumbsItems = computed(() => {
  const items = []
  items.push({ title: 'Scenario', href: '/simulation', disabled: false })

  if (route.path.includes('/plane')) {
    items.push({ title: 'Planes', href: '/simulation/plane', disabled: true })

    const plane = route.params.plane as string
    const time = route.params.time as string
    const scenarios =
      (route.query.scenarios as string | undefined)?.split(',') ??
      (route.params.scenario
        ? [route.params.scenario as string]
        : [route.params.scenarioA as string, route.params.scenarioB as string])
    const variables = (route.query.variables as string | undefined)?.split(',') ||
      (route.query.vars as string | undefined)?.split(',') || [route.params.variable as string]

    if (route.path.includes('/single')) {
      items.push({
        title: 'Single',
        href: makePathToPlaneSingleExplorer({
          plane,
          time,
          scenario: scenarios[0] ?? 'S0',
          variables
        }),
        disabled: false
      })
    } else if (route.path.includes('/comparator')) {
      items.push({
        title: 'Comparator',
        href: makePathToPlaneComparator({
          plane,
          time,
          scenarioA: scenarios[0] ?? 'S0',
          scenarioB: scenarios[1] ?? 'S1_1',
          variables
        }),
        disabled: false
      })
    } else if (route.path.includes('/explorer')) {
      items.push({
        title: 'Explorer',
        href: makePathToPlaneExplorer({ plane, time, variable: variables[0] ?? 'T', scenarios }),
        disabled: false
      })
    }
  } else if (route.path.includes('/timeSeries')) {
    items.push({ title: 'Time Series', href: '/simulation/timeSeries', disabled: true })

    const point = route.params.point as string
    const scenarios =
      (route.query.scenarios as string | undefined)?.split(',') ??
      (route.params.scenario
        ? [route.params.scenario as string]
        : [route.params.scenarioA as string, route.params.scenarioB as string])
    const variables =
      (route.query.variables as string | undefined)?.split(',') ||
      (route.query.vars as string | undefined)?.split(',') ||
      []

    if (route.path.includes('/single')) {
      items.push({
        title: 'Single',
        href: makePathToTimeSeriesSingleExplorer({
          point,
          scenario: scenarios[0] ?? 'S0',
          categories: []
        }),
        disabled: false
      })
    } else if (route.path.includes('/comparator')) {
      items.push({
        title: 'Comparator',
        href: makePathToTimeSeriesComparator({
          point,
          scenarioA: scenarios[0] ?? 'S0',
          scenarioB: scenarios[1] ?? 'S1_1',
          variables
        }),
        disabled: false
      })
    } else if (route.path.includes('/depth')) {
      items.push({
        title: 'Depth',
        href: makePathToTimeSeriesDepthExplorer({
          point,
          scenario: scenarios[0] ?? 'S0',
          variables
        }),
        disabled: false
      })
    } else if (route.path.includes('/explorer')) {
      items.push({
        title: 'Explorer',
        href: makePathToTimeSeriesExplorer({ point, scenarios, variables }),
        disabled: false
      })
    }
  }

  return items
})

type MenuItem = {
  title: string
  icon?: string
} & ({ type: 'link'; href: string; disabled: boolean } | { type: 'submenu'; children: MenuItem[] })

function getMenuItems(index: number): MenuItem[] {
  if (index === 1) {
    return route.path.includes('/plane') ? getSubItems('plane') : getSubItems('timeSeries')
  }

  const subPlane = getSubItems('plane')
  const subTimeSeries = getSubItems('timeSeries')

  return [
    {
      title: 'Plane',
      icon: mdiRectangle,
      type: 'submenu',
      children: subPlane
    },
    {
      title: 'Time Series',
      icon: mdiChartLine,
      type: 'submenu',
      children: subTimeSeries
    }
  ]
}
</script>

<template>
  <div class="scaffold">
    <v-sheet class="left-bar relative" elevation="12">
      <v-card class="d-flex flex-column h-100" flat>
        <v-card-text class="flex-grow-0">
          <v-breadcrumbs :items="breadcrumbsItems" density="compact" class="pt-0 px-0 pb-1">
            <template #divider="{ index }">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    size="small"
                    density="comfortable"
                    :icon="mdiChevronRight"
                    v-bind="props"
                  />
                </template>

                <v-list>
                  <v-list-item
                    v-for="item in getMenuItems(index)"
                    :key="item.title"
                    :to="item.type === 'link' ? item.href : ''"
                    link
                  >
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <template v-if="item.type === 'submenu'" #append>
                      <v-icon :icon="mdiChevronRight" size="x-small" />
                    </template>
                    <template v-if="item.icon" #prepend>
                      <v-icon :icon="item.icon" size="small" />
                    </template>

                    <v-menu
                      v-if="item.type === 'submenu'"
                      :open-on-focus="false"
                      activator="parent"
                      open-on-hover
                      submenu
                    >
                      <v-list>
                        <v-list-item
                          v-for="s in item.children"
                          :key="s.title"
                          :to="s.type === 'link' ? s.href : ''"
                          link
                        >
                          <v-list-item-title>{{ s.title }}</v-list-item-title>

                          <template v-if="s.icon" #prepend>
                            <v-icon :icon="s.icon" size="small" />
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-breadcrumbs>

          <h2>{{ props.title }}</h2>
          <slot name="subtitle"></slot>
        </v-card-text>
        <v-card-text class="left-pane-content" :class="{ 'pa-0': props.disableLeftPanePadding }">
          <slot name="left-pane"></slot>
        </v-card-text>
      </v-card>
    </v-sheet>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style>
.scaffold {
  --left-bar-width: min(max(300px, 25vw), 370px);
  display: grid;
  grid-template-areas: 'left-bar content';
  grid-template-columns: var(--left-bar-width) calc(100vw - var(--left-bar-width));
  grid-template-rows: 1fr;
}

.left-bar {
  grid-area: left-bar;
  height: 100dvh;
  position: relative;
  z-index: 1;
}

.content {
  grid-area: content;
  height: 100dvh;
  position: relative;
  overflow: auto;
}

.left-pane-content {
  flex: 1;
  display: grid;
  grid-template-rows: 1fr auto min-content;
  overflow-y: auto;
}
</style>
