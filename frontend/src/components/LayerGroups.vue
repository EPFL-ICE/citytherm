<script setup lang="ts">
import InfoTooltip from '@/components/InfoTooltip.vue'
import { mdiDownload } from '@mdi/js'
import { mdiChevronDown, mdiChevronRight, mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js'
import { useLayersStore } from '@/stores/layers'
import { useCompareStore } from '@/stores/compare'
import { useCityStore } from '@/stores/city'

// Use the stores - now the component gets everything from the stores, no props needed
const layersStore = useLayersStore()
const compareStore = useCompareStore()
const cityStore = useCityStore()
import { baseUrl } from '@/config/layerTypes'
function exportFullCSV() {
  const url = `${baseUrl}/citytherm_${cityStore.city}.csv`
  // should be citytherm_[city name].csv
  const a = document.createElement('a')
  a.href = url
  a.download = `citytherm_${cityStore.city}.csv`
  a.click()
}
</script>

<template>
  <div>
    <div class="layer-group mb-1 base-layer">
      <v-checkbox
        v-model="layersStore.selectedLayers"
        :value="'baselayer'"
        :disabled="
          !layersStore.selectedLayers.includes('baselayer') &&
          layersStore.selectedLayers.length >= compareStore.layerLimit
        "
        density="compact"
        class="w-100"
        :hide-details="true"
      >
        <template #label>
          <div class="d-flex align-center justify-space-between w-100">
            <h5 class="text-uppercase mb-0">Map</h5>
            <v-btn
              density="compact"
              color="primary"
              :prepend-icon="mdiDownload"
              @click="exportFullCSV"
            >
              Download City
            </v-btn>
          </div>
        </template>
      </v-checkbox>
    </div>
    <div v-for="group in layersStore.layerGroups" :key="group.id" class="layer-group mb-1">
      <!-- Group Header with Toggle -->
      <div class="d-flex align-center justify-space-between">
        <!-- Group Title -->
        <h4
          class="text-uppercase mb-0 flex-grow-1 group-header"
          @click="layersStore.toggleGroup(group.id)"
        >
          <v-icon
            :icon="layersStore.expandedGroups[group.id] ? mdiChevronDown : mdiChevronRight"
            size="small"
            class="mr-2 d"
          ></v-icon>
          {{ group.label }}
        </h4>

        <!-- Visibility Toggle Icon -->
        <v-icon
          :icon="layersStore.isGroupVisible(group.id) ? mdiEyeOutline : mdiEyeOffOutline"
          size="small"
          class="visibility-toggle"
          :class="{ active: layersStore.isGroupVisible(group.id) }"
          :title="layersStore.isGroupVisible(group.id) ? 'Hide layer group' : 'Show layer group'"
          @click.stop="layersStore.toggleGroupVisibility(group.id)"
        ></v-icon>
      </div>

      <!-- Group Content (Collapsible) -->
      <div v-show="layersStore.expandedGroups[group.id]" class="mt-0">
        <template
          v-for="item in layersStore.possibleLayers.filter((layer) => layer.groupId === group.id)"
          :key="item.id"
        >
          <v-checkbox
            v-model="layersStore.selectedLayers"
            :value="item.id"
            :disabled="
              !layersStore.selectedLayers.includes(item.id) &&
              layersStore.selectedLayers.length >= compareStore.layerLimit
            "
            density="compact"
            :hide-details="true"
          >
            <template #label>
              <h5 class="text-uppercase mb-0">{{ item.label }}</h5>
            </template>
            <template #append>
              <info-tooltip>{{ item.info }}</info-tooltip>
            </template>
          </v-checkbox>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base-layer :deep(.v-label) {
  width: 100%;
}
/* Styles remain the same */
.layer-group {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 8px;
}

.group-header {
  cursor: pointer;
  padding: 8px 0;
}

.group-header:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}

.visibility-toggle {
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.visibility-toggle:hover {
  opacity: 1;
  transform: scale(1.1);
}

.visibility-toggle.active {
  opacity: 1;
  color: var(--v-theme-primary);
}

.no-break {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  display: inline-block;
}

.layer-selection-counter {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 500;
}
</style>
