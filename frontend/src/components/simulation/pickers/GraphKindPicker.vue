<script setup lang="ts">
import {
  type GraphKindDescription,
  graphKindGroups,
  graphKindsDescriptions
} from './graphKindPickerUtils'

const selectedGraphKind = defineModel<GraphKindDescription | null>({ default: null })
</script>

<template>
  <v-item-group v-model="selectedGraphKind" selected-class="bg-primary" mandatory>
    <div v-for="group in graphKindGroups" :key="group.name" class="mb-16">
      <div class="d-flex align-center mb-2">
        <v-icon :icon="group.icon" size="xx-large" class="me-3" />
        <h5 class="text-h5">{{ group.name }}</h5>
      </div>
      <div class="text-body-1 mb-4">{{ group.description }}</div>
      <v-item
        v-for="kind in group.kinds"
        :key="kind"
        v-slot="{ selectedClass, toggle }"
        :value="graphKindsDescriptions[kind]"
      >
        <v-card :class="['pa-4', selectedClass]" dark flat @click="toggle">
          <div class="d-flex align-center">
            <v-icon :icon="graphKindsDescriptions[kind].icon" class="me-4" size="large" />
            <div>
              <h5 class="text-h6">
                {{ graphKindsDescriptions[kind].name }}
              </h5>
              <p class="text-body-1">{{ graphKindsDescriptions[kind].description }}</p>
            </div>
          </div>
        </v-card>
      </v-item>
    </div>
  </v-item-group>
</template>
