<script setup lang="ts">
/**
 * @file 工作区组件：承载贡献图渲染与交互。
 */
import ContributionGraph from './ContributionGraph.vue';
</script>

<template>
  <main class="workarea dot-bg">
    <div class="workspace-card">
      <ContributionGraph :initialYear="2026" />
    </div>
  </main>
</template>

<style scoped>
.workarea {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: auto;
  padding: 2rem;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.workspace-card {
  background-color: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--color-border);
  padding: 3rem 4rem;
  max-width: fit-content;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
