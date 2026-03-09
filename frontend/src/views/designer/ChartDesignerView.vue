<script setup lang="ts">
import TwoPanesLayoutSimple from '@/components/ui/TwoPanesLayoutSimple.vue'
import ToolSet from '@/components/ui/ToolSet.vue'
import CreateChartModal from '@/components/simulation/CreateChartModal.vue';
import GraphRenderer from '@/components/simulation/graphKinds/GraphRenderer.vue';
import GraphParamsRenderer from '@/components/simulation/graphKinds/GraphParamsRenderer.vue';
import GraphSettingsViewer from '@/components/simulation/graphKinds/GraphSettingsViewer.vue';
import { computed, ref } from 'vue';
import { useGraphsStore, type CreateGraphDesignInput } from '@/stores/simulation/graphs';
import { AsyncResult } from 'unwrapped/core';
import { mdiNoteEditOutline } from '@mdi/js';

const graphsStore = useGraphsStore()

const currentGraphId = ref<string | null>(null)
const currentGraph = computed(() => {
  if (!currentGraphId.value) return null
  return graphsStore.graphs[currentGraphId.value] ?? null
})

function newGraph(settings: CreateGraphDesignInput) {
  return AsyncResult.run(function* () {
    const graph = yield* graphsStore.createDesign(settings)
    currentGraphId.value = graph.id
  })
}

function renameGraph() {
  const newName = prompt('New graph name', currentGraph.value?.name)
  if (!newName || !currentGraph.value) return
  graphsStore.graphs[currentGraph.value.id].name = newName
}

</script>

<template>
  <two-panes-layout-simple
    :title="currentGraph ? currentGraph.name : 'No graph selected'"
    :disable-left-pane-padding="true"
  >
    <template #subtitle>
      <v-btn
        v-if="currentGraph"
        :prepend-icon="mdiNoteEditOutline"
        color="primary"
        density="comfortable"
        @click="renameGraph"
      >
        Rename graph
      </v-btn>
    </template>
    <template #left-pane>
      <tool-set>
        <template #header>
          <div
            class="pa-4"
            v-if="currentGraph"
          >
            <graph-settings-viewer
              :graph="currentGraph"
            />
          </div>
        </template>
        <template #default>
          <graph-params-renderer
            v-if="currentGraph"
            :graph="currentGraph"
          />
        </template>
      </tool-set>
    </template>

    <template #default>
      <div class="d-flex align-center mb-4">
        <v-tabs
          v-model="currentGraphId"
          color="primary"
        >
          <v-tab
            v-for="value in graphsStore.graphs"
            :key="value.id"
            :value="value.id"
          >
            {{ value.name }}
          </v-tab>
        </v-tabs>
        <create-chart-modal
          @create="(settings) => {
            newGraph({
              graphKindSlug: settings.graphKind.slug,
              scenarios: settings.scenarios,
              plane: settings.plane,
              point: settings.point,
            })
          }"
        />
      </div>

      <div
        v-if="currentGraph"
        class="px-4"
      >
        <graph-renderer
          :graph="currentGraph"
        />
      </div>
      <v-empty-state
        v-else
        headline="No graph to display"
        title="Please create a graph to display it here"
      />
    </template>
  </two-panes-layout-simple>
</template>

<style scoped>
.right-border {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.scenario-wrapper {
  transition: 0.25s;
}

.grayed {
  opacity: 0.5;
}
</style>