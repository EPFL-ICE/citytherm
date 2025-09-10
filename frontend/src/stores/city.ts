import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type CityKey = 'geneva' | 'zurich'

interface CityConfig {
  center: { lat: number; lng: number }
  zoom: number
  gridFile: string
  sourceLayer: string
  label: string
  boundingBox: [number, number, number, number]
}

const cityConfigs: Record<CityKey, CityConfig> = {
  geneva: {
    center: { lat: 46.2044, lng: 6.1432 },
    zoom: 11,
    gridFile: 'geneva_grid_data.pmtiles',
    sourceLayer: 'geneva_grid_data_reprojected',
    label: 'Geneva',
    boundingBox: [6.113384389737242, 46.180419147635035, 6.171997884756156, 46.229665565001255]
  },
  zurich: {
    center: { lat: 47.3769, lng: 8.5417 },
    zoom: 11,
    gridFile: 'zurich_grid_data.pmtiles',
    sourceLayer: 'zurich_grid_data_reprojected',
    label: 'Zurich',
    boundingBox: [8.457923700018101, 47.3221556860289, 8.619716714725223, 47.432477509710516]
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
