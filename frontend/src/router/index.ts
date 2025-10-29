import SimulationResultTimeSeriesExplorer from '@/views/simulation/SimulationResultTimeSeriesExplorer.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ComparisonView from '../views/ComparisonView.vue'
import SimulationResultPlaneExplorerView from '../views/simulation/SimulationResultPlaneExplorerView.vue'
import SimulationScenarioPickerView from '../views/simulation/SimulationScenarioPickerView.vue'

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
      path: '/simulation/plane/:scenarioA/:scenarioB/:plane/:time',
      name: 'simulation result plane explorer',
      component: SimulationResultPlaneExplorerView
    },
    {
      path: '/simulation/timeSeries/:scenarioA/:scenarioB/:point',
      name: 'simulation result time series explorer',
      component: SimulationResultTimeSeriesExplorer
    }
  ]
})

export default router
