<script setup lang="ts"></script>

<template>
  <div class="toolset">
    <div class="header">
      <slot name="header"></slot>
    </div>
    <div class="toolset-content">
      <slot></slot>
    </div>
    <div class="footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.toolset {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-areas:
    'header'
    'toolset-content'
    'footer';

  grid-template-rows: auto 1fr auto;
}

.header {
  grid-area: header;
}

.toolset-content {
  grid-area: toolset-content;
  /* allow the grid item to shrink below its content height so overflow works
       (important when ToolSet is placed inside flex containers) */
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
}

.footer {
  grid-area: footer;
}
</style>
