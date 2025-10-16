<script setup lang="ts">
import { useScenariosStore, type ScenarioDescription } from '@/stores/scenarios'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import TwoPanesLayout from '@/components/TwoPanesLayout.vue'
import { computed, onMounted, ref, shallowRef } from 'vue'


const scenarioStore = useScenariosStore()

onMounted(async () => {
})

</script>

<template>
  <two-panes-layout title="Simulation result slice explorer">
    <template #left-pane>
      <div>Variables list</div>
    </template>

    <template #default>
    </template>
  </two-panes-layout>
</template>
