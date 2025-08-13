<script setup lang="ts">
import { useCompareStore } from '@/stores/compare'

const store = useCompareStore()

function removeNeighborhood(uid: string) {
  store.toggleNeighborhood(uid)
}

function clearAll() {
  store.clearSelections()
}
</script>

<template>
  <div class="selection-bar">
    <div class="chips-container">
      <v-chip
        v-for="(uid, index) in store.selectedNeighborhoodIds"
        :key="uid"
        closable
        @click:close="removeNeighborhood(uid)"
      >
        {{ index + 1 }} {{ uid }}
      </v-chip>
    </div>
    <v-btn
      v-if="store.selectedNeighborhoodIds.length > 0"
      variant="text"
      size="small"
      @click="clearAll"
    >
      Clear all
    </v-btn>
  </div>
</template>

<style scoped>
.selection-bar {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-grow: 1;
}

.chips-container .v-chip {
  margin: 2px;
}
</style>
