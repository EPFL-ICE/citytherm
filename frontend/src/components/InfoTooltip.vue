<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { mdiInformationOutline } from '@mdi/js'
import { tooltipManager } from '@/utils/tooltipManager'

const props = defineProps<{
  content: string
}>()

const tooltipVisible = ref(false)
const tooltipElement = ref<HTMLElement | null>(null)

function hideTooltip() {
  tooltipVisible.value = false
  tooltipManager.unregister(hideTooltip)
}

function toggleTooltip(event: Event) {
  event.stopPropagation()
  tooltipVisible.value = !tooltipVisible.value

  if (tooltipVisible.value) {
    // Register this tooltip as open, which will close any other open tooltip
    tooltipManager.registerOpen(hideTooltip)
  } else {
    // Unregister this tooltip as it's now closed
    tooltipManager.unregister(hideTooltip)
  }
}

function handleClickOutside(event: MouseEvent) {
  if (tooltipElement.value && !tooltipElement.value.contains(event.target as Node)) {
    hideTooltip()
  }
}

function handleLinkClick(event: Event) {
  const target = event.target as HTMLElement

  // Find the closest anchor tag (could be the target itself or a parent)
  const anchor = target.closest('a')
  if (anchor) {
    // Allow the link to behave normally
    event.stopPropagation()

    // Ensure all links open in a new tab with security attributes
    anchor.setAttribute('target', '_blank')
    anchor.setAttribute('rel', 'noopener noreferrer')
    // open anchor!
    window.open(anchor.href, '_blank', 'noopener,noreferrer')
    // Close tooltip for all links
    hideTooltip()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // Ensure tooltip is unregistered when component is destroyed
  tooltipManager.unregister(hideTooltip)
})
</script>

<template>
  <div ref="tooltipElement">
    <v-tooltip v-model="tooltipVisible" left max-width="312" :open-on-hover="false":persistent="true">
      <template #activator="{ props }">
        <v-icon
          size="small"
          class="opacity-60"
          v-bind="props"
          :icon="mdiInformationOutline"
          @click.stop="toggleTooltip"
        />
      </template>
      <div class="tooltip-content">
        <div v-html="content"  @click.capture="handleLinkClick"></div>
        <div class="d-flex justify-end mt-2">
          <v-btn class="close-tooltip" variant="tonal" size="small" @click="hideTooltip"> Close </v-btn>
        </div>
      </div>
    </v-tooltip>
  </div>
</template>

<style scoped>

.close-tooltip {
  cursor: pointer;
}
.tooltip-content {
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;

  pointer-events: auto; /* ✅ allows clicking */
}

.tooltip-content :deep(a) {
  color: #2196f3;
  text-decoration: underline;
}

.tooltip-content :deep(a:hover) {
  color: #1976d2;
}
</style>
