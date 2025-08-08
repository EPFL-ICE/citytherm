import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type CityKey = 'geneva' | 'zurich'

interface CityConfig {
  center: { lat: number; lng: number }
  zoom: number
  gridFile: string
  sourceLayer: string
  label: string
}

const cityConfigs: Record<CityKey, CityConfig> = {
  geneva: {
    center: { lat: 46.2044, lng: 6.1432 },
    zoom: 11,
    gridFile: 'geneva_grid_data.pmtiles',
    sourceLayer: 'geneva_grid_data_reprojected',
    label: 'Geneva'
  },
  zurich: {
    center: { lat: 47.3769, lng: 8.5417 },
    zoom: 11,
    gridFile: 'zurich_grid_data.pmtiles',
    sourceLayer: 'zurich_grid_data_reprojected',
    label: 'Zurich'
  }
}

export const useCityStore = defineStore('city', () => {
  const city = ref<CityKey>('geneva')
  const current = computed(() => cityConfigs[city.value])
  function setCity(newCity: CityKey) {
    city.value = newCity
  }
  const cities = Object.entries(cityConfigs).map(([value, cfg]) => ({ value, label: cfg.label }))
  return { city, current, setCity, cities }
})
