<script setup lang="ts">
/**
 * @file 用户首页视图：组合工作区与工具栏。
 */
import WorkArea from '../../components/WorkArea.vue'
import Toolbar from '../../components/Toolbar.vue'

// Note: Toolbar was originally in App.vue next to WorkArea in the workspace-wrapper
</script>

<template>
  <div class="home-wrapper">
    <WorkArea />
    <Toolbar />
  </div>
</template>

<style scoped>
.home-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}
</style>
