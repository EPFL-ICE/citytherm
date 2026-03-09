<script setup lang="ts">
const props = defineProps<{
  title: string
  disableLeftPanePadding?: boolean
}>()
</script>

<template>
  <div class="scaffold">
    <v-sheet class="left-bar relative" elevation="12">
      <v-card class="d-flex flex-column h-100" flat>
        <v-card-text class="flex-grow-0">
          <h2>{{ props.title }}</h2>
          <slot name="subtitle"></slot>
        </v-card-text>
        <v-card-text class="left-pane-content" :class="{ 'pa-0': props.disableLeftPanePadding }">
          <slot name="left-pane"></slot>
        </v-card-text>
      </v-card>
    </v-sheet>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style>
.scaffold {
  --left-bar-width: min(max(300px, 25vw), 370px);
  display: grid;
  grid-template-areas: 'left-bar content';
  grid-template-columns: var(--left-bar-width) calc(100vw - var(--left-bar-width));
  grid-template-rows: 1fr;
}

.left-bar {
  grid-area: left-bar;
  height: 100dvh;
  position: relative;
  z-index: 1;
}

.content {
  grid-area: content;
  height: 100dvh;
  position: relative;
  overflow: auto;
}

.left-pane-content {
  flex: 1;
  display: grid;
  grid-template-rows: 1fr auto min-content;
  overflow-y: auto;
}
</style>
