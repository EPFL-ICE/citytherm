<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{
  numColumns: number
  rerenderOnColumnsChange?: boolean
}>()

// Echarts children don't resize properly if they are not given the right width to work with from the start. That's an issue because the number of columns is dynamic.
// To work around this, we force a re-render of the slot content each time the number of columns changes. Since all data is cached, this is not a visible issue, but a better solution is welcome.
const renderKey = ref(0)
watch(
  () => props.numColumns,
  async () => {
    if (!props.rerenderOnColumnsChange) return

    // Step 1: remove slot content
    renderKey.value = 0
    // Step 2: wait for DOM reflow
    await nextTick()
    // Step 3: restore slot
    renderKey.value = Date.now() // unique key to re-mount charts
  }
)

// Create a computed style object for dynamic grid columns
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.numColumns}, 1fr)`
}))
</script>

<template>
  <div :class="['map-grid']" :style="gridStyle" :key="renderKey">
    <slot></slot>
  </div>
</template>

<style scoped>
.map-grid {
  display: grid;
  gap: 0.75rem;
  grid-auto-rows: 1fr;
}
</style>
