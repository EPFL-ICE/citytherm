<script setup lang="ts">
</script>

<template>
  <v-container class="fill-height pa-0 overflow-hidden" fluid>
    <v-row class="fill-height overflow-y-hidden">
      <v-col xl="2" cols="3" class="params-col border-e-md overflow-y-auto overflow-x-hidden">
        <v-card>
          <v-card-text class="d-flex flex-row align-center ga-2">
            <h2>Scenario picker</h2>
          </v-card-text>
          <v-card-text class="d-flex flex-column">
            <!-- Use the updated LayerGroups component -->
            List of scenarios to pick from
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <h3>Scenario preview</h3>
      </v-col>
    </v-row>
  </v-container>
</template>
