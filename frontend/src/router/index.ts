import { createRouter, createWebHistory } from 'vue-router'
import ComparisonView from '../views/ComparisonView.vue'
import SimulationScenarioPickerView from '../views/simulation/SimulationScenarioPickerView.vue'
import SimulationResultSliceExplorerView from '../views/simulation/SimulationResultSliceExplorerView.vue'
import SimulationResultTimeSeriesExplorer from '@/views/simulation/SimulationResultTimeSeriesExplorer.vue'

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
      name: 'simulation result slice explorer',
      component: SimulationResultSliceExplorerView
    },
    {
      path: '/simulation/timeSeries/:scenarioA/:scenarioB/:point',
      name: 'simulation result time series explorer',
      component: SimulationResultTimeSeriesExplorer
    },
  ]
})

export default router
