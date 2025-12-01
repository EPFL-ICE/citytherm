import { createRouter, createWebHistory } from 'vue-router'
import ComparisonView from '../views/ComparisonView.vue'
import SimulationScenarioPickerView from '../views/simulation/SimulationScenarioPickerView.vue'
import SimulationResultPlaneExplorerView from '../views/simulation/SimulationResultPlaneExplorerView.vue'
import SimulationResultSinglePlaneExplorerView from '../views/simulation/SimulationResultSinglePlaneExplorerView.vue'
import SimulationResultPlaneComparatorView from '../views/simulation/SimulationResultPlaneComparatorView.vue'
import SimulationResultTimeSeriesExplorer from '@/views/simulation/SimulationResultTimeSeriesExplorer.vue'
import SimulationResultTimeSeriesComparator from '@/views/simulation/SimulationResultTimeSeriesComparator.vue'
import SimulationResultTimeSeriesSingleExplorer from '@/views/simulation/SimulationResultTimeSeriesSingleExplorer.vue'
import SimulationResultTimeSeriesDepthExplorer from '@/views/simulation/SimulationResultTimeSeriesDepthExplorer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ComparisonView
    },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationScenarioPickerView
    },
    {
      path: '/simulation/plane/explorer/:plane/:time/:variable',
      name: 'simulation result plane explorer',
      component: SimulationResultPlaneExplorerView
    },
    {
      path: '/simulation/plane/single/:plane/:time/:scenario',
      name: 'simulation result plane explorer single scenario',
      component: SimulationResultSinglePlaneExplorerView
    },
    {
      path: '/simulation/plane/comparator/:scenarioA/:scenarioB/:plane/:time',
      name: 'simulation result plane comparator',
      component: SimulationResultPlaneComparatorView
    },
    {
      path: '/simulation/timeSeries/explorer/:point',
      name: 'simulation result time series explorer',
      component: SimulationResultTimeSeriesExplorer
    },
    {
      path: '/simulation/timeSeries/comparator/:scenarioA/:scenarioB/:point',
      name: 'simulation result time series comparator',
      component: SimulationResultTimeSeriesComparator
    },
    {
      path: '/simulation/timeSeries/single/:scenario/:point',
      name: 'simulation result time series single explorer',
      component: SimulationResultTimeSeriesSingleExplorer
    },
    {
      path: '/simulation/timeSeries/depth/:scenario/:point',
      name: 'simulation result time series depth explorer',
      component: SimulationResultTimeSeriesDepthExplorer
    }
  ]
})

export default router
