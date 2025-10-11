import { createRouter, createWebHistory } from 'vue-router'
import ComparisonView from '../views/ComparisonView.vue'
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
    }
  ]
})

export default router
