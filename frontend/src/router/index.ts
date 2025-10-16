import { createRouter, createWebHistory } from 'vue-router'
import ComparisonView from '../views/ComparisonView.vue'
import SimulationScenarioPickerView from '../views/simulation/SimulationScenarioPickerView.vue'
import SimulationResultSliceExplorerView from '../views/simulation/SimulationResultSliceExplorerView.vue'

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
      path: '/simulation/:scenario/:planeSlug',
      name: 'simulation result slice explorer',
      component: SimulationResultSliceExplorerView
    }
  ]
})

export default router
