<template>
  <div class="lst-date-picker">
    <v-select
      v-model="selectedDate"
      :items="availableDates"
      item-title="label"
      item-value="value"
      label="Select LST Date"
      density="compact"
      variant="outlined"
      hide-details
      @update:model-value="onDateChange"
    >
      <template #prepend-inner>
        <v-icon icon="mdi-calendar"></v-icon>
      </template>
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps<{
  city: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'date-selected', date: string): void
}>()

// State
const selectedDate = ref<string>('')
const lstFiles = ref<Array<{ filename: string; date: string; city: string }>>([])

// Available dates for the selected city
const availableDates = computed(() => {
  const cityFiles = lstFiles.value.filter(
    (file) => file.city.toLowerCase() === props.city.toLowerCase()
  )
  return cityFiles.map((file) => ({
    label: formatDate(file.date),
    value: file.filename
  }))
})

// Format date for display
const formatDate = (dateStr: string): string => {
  // Assuming dateStr is in format YYYY-MM-DD
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

// Handle date change
const onDateChange = (value: string) => {
  emit('date-selected', value)
}

// Parse filename to extract date and city
const parseFilename = (filename: string): { date: string; city: string } | null => {
  // Expected format: LST-city-YY-M-D.cog.tif or LST-city-YYYY-MM-DD.cog.tif
  const match = filename.match(/LST-([a-zA-Z]+)-(\d{2,4})-(\d{1,2})-(\d{1,2})\.cog\.tif/)
  if (match) {
    const [, city, year, month, day] = match
    // Convert to YYYY-MM-DD format
    const fullYear = year.length === 2 ? `20${year}` : year
    const paddedMonth = month.padStart(2, '0')
    const paddedDay = day.padStart(2, '0')
    return {
      date: `${fullYear}-${paddedMonth}-${paddedDay}`,
      city: city.toLowerCase()
    }
  }

  // Try alternative format: LST-city-YYYY-MM-DD.cog.tif
  const altMatch = filename.match(/LST-([a-zA-Z]+)-(\d{4})-(\d{2})-(\d{2})\.cog\.tif/)
  if (altMatch) {
    const [, city, year, month, day] = altMatch
    return {
      date: `${year}-${month}-${day}`,
      city: city.toLowerCase()
    }
  }

  return null
}

// Initialize component
onMounted(() => {
  // In a real implementation, this would come from an API or file scan
  // For now, we'll simulate with the files we know exist
  const files = [
    'LST-bern-19-6-13.cog.tif',
    'LST-bern-19-6-29.cog.tif',
    'LST-bern-19-7-24.cog.tif',
    'LST-bern-19-8-09.cog.tif',
    'LST-bern-19-8-25.cog.tif',
    'LST-bern-20-6-24.cog.tif',
    'LST-bern-20-8-11.cog.tif',
    'LST-bern-21-7-20.cog.tif',
    'LST-bern-21-8-14.cog.tif',
    'LST-bern-21-8-21.cog.tif',
    'LST-bern-22-7-16.cog.tif',
    'LST-bern-22-8-1.cog.tif',
    'LST-bern-22-8-8.cog.tif',
    'LST-bern-23-08-11.cog.tif',
    'LST-bern-23-08-20.cog.tif',
    'LST-bern-23-6-17.cog.tif',
    'LST-bern-23-6-24.cog.tif',
    'LST-geneva-19-06-13.cog.tif',
    'LST-geneva-19-06-29.cog.tif',
    'LST-geneva-21-7-20.cog.tif',
    'LST-geneva-21-8-21.cog.tif',
    'LST-geneva-22-6-21.cog.tif',
    'LST-geneva-22-7-7.cog.tif',
    'LST-geneva-22-8-08.cog.tif',
    'LST-geneva-23-6-24.cog.tif',
    'LST-geneva-23-7-10.cog.tif',
    'LST-geneva-23-8-11.cog.tif',
    'LST-zurich-19-7-24.cog.tif',
    'LST-zurich-19-8-18.cog.tif',
    'LST-zurich-19-8-25.cog.tif',
    'LST-zurich-19-8-9.cog.tif',
    'LST-zurich-20-6-1.cog.tif',
    'LST-zurich-20-6-24.cog.tif',
    'LST-zurich-20-8-11.cog.tif',
    'LST-zurich-20-8-20.cog.tif',
    'LST-zurich-21-8-14.cog.tif',
    'LST-zurich-22-6-23.cog.tif',
    'LST-zurich-22-7-16.cog.tif',
    'LST-zurich-22-7-25.cog.tif',
    'LST-zurich-22-8-1.cog.tif',
    'LST-zurich-22-8-10.cog.tif',
    'LST-zurich-23-8-20.cog.tif'
  ]

  lstFiles.value = files
    .map((filename) => {
      const parsed = parseFilename(filename)
      return parsed ? { filename, ...parsed } : null
    })
    .filter(Boolean) as Array<{ filename: string; date: string; city: string }>

  // Set default selection if available
  if (availableDates.value.length > 0) {
    selectedDate.value = availableDates.value[0].value
    emit('date-selected', selectedDate.value)
  }
})
</script>

<style scoped>
.lst-date-picker {
  padding: 8px;
}
</style>
