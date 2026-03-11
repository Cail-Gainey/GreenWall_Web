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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
