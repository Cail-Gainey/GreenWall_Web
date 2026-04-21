<script setup lang="ts">
/**
 * @file 三栏布局基础壳：侧边栏 + 顶部 + 主工作区。
 */
</script>

<template>
  <div class="app-layout">
    <slot name="sidebar"></slot>
    <div class="main-content">
      <slot name="header"></slot>
      <div class="workspace-wrapper">
        <slot name="main"></slot>
        <slot name="toolbar"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.workspace-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
